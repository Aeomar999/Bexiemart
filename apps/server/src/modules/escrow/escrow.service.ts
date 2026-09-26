import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminGateway } from "../admin/admin.gateway";

@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminGateway: AdminGateway
  ) {}

  private readonly AUTO_RELEASE_HOURS_AFTER_DELIVERED = 72;
  private readonly AUTO_RELEASE_DAYS_AFTER_SHIPPED = 14;
  private readonly AUTO_REFUND_DAYS_AFTER_CONFIRMED = 14;

  async list(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const vendorProfile = await this.prisma.vendorProfile.findUnique({ where: { userId } });

    const buyerEscrows = wallet
      ? this.prisma.escrow.findMany({
          where: { buyerWalletId: wallet.id },
          include: { order: true, vendor: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const vendorEscrows = vendorProfile
      ? this.prisma.escrow.findMany({
          where: { vendorId: vendorProfile.id },
          include: { order: true, vendor: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const [buyer, vendor] = await Promise.all([buyerEscrows, vendorEscrows]);

    const map = new Map<string, any>();
    for (const e of buyer) map.set(e.id, e);
    for (const e of vendor) map.set(e.id, e);

    return Array.from(map.values());
  }

  async get(userId: string, id: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
      include: { order: true, vendor: true },
    });

    if (!escrow) throw new NotFoundException("Escrow not found");

    await this.assertOwner(userId, escrow);

    return escrow;
  }

  async dispute(userId: string, id: string, reason: string) {
    const escrow = await this.prisma.escrow.findUnique({ where: { id } });

    if (!escrow) throw new NotFoundException("Escrow not found");
    if (escrow.status !== "HELD") throw new BadRequestException("Escrow is not in HELD status");

    await this.assertOwner(userId, escrow);

    const disputed = await this.prisma.escrow.update({
      where: { id },
      data: { status: "DISPUTED", reason },
    });

    // Raise the dispute on the admin portal's live ops feed for triage.
    this.adminGateway.emitDisputeCreated({ disputeId: disputed.id, reason });

    return disputed;
  }

  async release(userId: string, id: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
      include: { vendor: true, order: true },
    });

    if (!escrow) throw new NotFoundException("Escrow not found");
    if (escrow.status !== "HELD") throw new BadRequestException("Escrow is not in HELD status");

    if (!escrow.vendor || escrow.vendor.userId !== userId) {
      throw new ForbiddenException("Only the vendor can release escrow");
    }

    // Vendor can only release if order is delivered AND (buyer confirmed OR auto-release window passed)
    if (escrow.order.status !== "delivered") {
      throw new BadRequestException("Escrow can only be released after order is delivered");
    }

    const isConfirmed = await this.prisma.deliveryJob.findFirst({
      where: { orderId: escrow.orderId, status: "DELIVERED" },
      select: { id: true },
    });
    const hoursSinceDelivered = escrow.order.updatedAt
      ? (Date.now() - new Date(escrow.order.updatedAt).getTime()) / (1000 * 60 * 60)
      : Infinity;
    const autoReleaseWindowPassed = hoursSinceDelivered >= this.AUTO_RELEASE_HOURS_AFTER_DELIVERED;

    if (!isConfirmed && !autoReleaseWindowPassed) {
      throw new BadRequestException(
        "Escrow can only be released after buyer confirms delivery or auto-release window (72h) passes"
      );
    }

    const reference = `esc_rel_${id}_${Date.now()}`;
    await this.releaseEscrow(escrow, reference);
    return this.prisma.escrow.findUnique({ where: { id }, include: { vendor: true, order: true } });
  }

  async refund(userId: string, id: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!escrow) throw new NotFoundException("Escrow not found");
    if (escrow.status !== "HELD") throw new BadRequestException("Escrow is not in HELD status");

    const buyerWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!buyerWallet || buyerWallet.id !== escrow.buyerWalletId) {
      throw new ForbiddenException("Only the buyer can refund escrow");
    }

    // Buyer can only refund if order is cancelled or refund_requested (admin approved)
    // Auto-refund timeout is handled by cron job only
    const allowedStatuses = ["cancelled", "refund_requested"];

    if (!allowedStatuses.includes(escrow.order.status)) {
      throw new BadRequestException(
        "Refund only allowed for cancelled orders or approved refund requests"
      );
    }

    const reference = `esc_ref_${id}_${Date.now()}`;
    await this.refundEscrow(escrow, reference);
    return this.prisma.escrow.findUnique({ where: { id }, include: { order: true } });
  }

  /** Internal: release escrow after delivery confirmation or auto-release. Uses atomic claim pattern. */
  async releaseForDelivery(escrowId: string): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { vendor: true, order: true },
    });

    if (!escrow || escrow.status !== "HELD") return;

    const reference = `esc_rel_${escrowId}_${Date.now()}`;
    await this.releaseEscrow(escrow, reference);
  }

  /** Internal: refund escrow for cancellation or auto-refund. Uses atomic claim pattern. */
  async refundForCancellation(escrowId: string): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { order: true },
    });

    if (!escrow || escrow.status !== "HELD") return;

    const reference = `esc_ref_${escrowId}_${Date.now()}`;
    await this.refundEscrow(escrow, reference);
  }

  private async releaseEscrow(escrow: any, reference: string) {
    const vendorWallet = await this.prisma.wallet.findUnique({
      where: { userId: escrow.vendor.userId },
    });

    if (!vendorWallet) throw new BadRequestException("Vendor wallet not found");

    await this.prisma.$transaction(
      async (tx) => {
        // Atomic claim: only one caller (delivery confirm, auto-release cron, vendor endpoint) can flip HELD→RELEASED
        const claim = await tx.escrow.updateMany({
          where: { id: escrow.id, status: "HELD" },
          data: { status: "RELEASED" },
        });
        if (claim.count === 0) {
          throw new ConflictException("Escrow has already been resolved");
        }

        if (!escrow.vendorWalletId) {
          await tx.escrow.update({
            where: { id: escrow.id },
            data: { vendorWalletId: vendorWallet.id },
          });
        }

        const txn = await tx.transaction.create({
          data: {
            walletId: vendorWallet.id,
            type: "EARNINGS",
            status: "COMPLETED",
            amount: escrow.amount,
            fee: Number(escrow.commission),
            netAmount: Number(escrow.netAmount),
            reference,
            description: `Escrow release for order ${escrow.orderId}`,
            counterpartyWalletId: escrow.buyerWalletId,
          },
        });

        await tx.wallet.update({
          where: { id: vendorWallet.id },
          data: { balance: { increment: Number(escrow.netAmount) } },
        });

        await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            releasedAt: new Date(),
            releasedTxnId: txn.id,
            vendorWalletId: vendorWallet.id,
          },
        });
      },
      { isolationLevel: "Serializable" }
    );
  }

  private async refundEscrow(escrow: any, reference: string) {
    const buyerWallet = await this.prisma.wallet.findUnique({
      where: { id: escrow.buyerWalletId },
    });

    if (!buyerWallet) throw new BadRequestException("Buyer wallet not found");

    await this.prisma.$transaction(
      async (tx) => {
        // Atomic claim: only one caller (cancellation, auto-refund cron, buyer endpoint) can flip HELD→REFUNDED
        const claim = await tx.escrow.updateMany({
          where: { id: escrow.id, status: "HELD" },
          data: { status: "REFUNDED" },
        });
        if (claim.count === 0) {
          throw new ConflictException("Escrow has already been resolved");
        }

        const txn = await tx.transaction.create({
          data: {
            walletId: buyerWallet.id,
            type: "REVERSAL",
            status: "COMPLETED",
            amount: escrow.amount,
            fee: 0,
            netAmount: Number(escrow.amount),
            reference,
            description: `Escrow refund for order ${escrow.orderId}`,
            counterpartyWalletId: escrow.vendorWalletId,
          },
        });

        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: { balance: { increment: Number(escrow.amount) } },
        });

        await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            refundedAt: new Date(),
            refundedTxnId: txn.id,
          },
        });
      },
      { isolationLevel: "Serializable" }
    );
  }

  private async assertOwner(userId: string, escrow: any) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const vendorProfile = await this.prisma.vendorProfile.findUnique({ where: { userId } });

    const isBuyer = wallet && escrow.buyerWalletId === wallet.id;
    const isVendor = vendorProfile && escrow.vendorId === vendorProfile.id;

    if (!isBuyer && !isVendor) {
      throw new ForbiddenException("You do not have access to this escrow");
    }
  }
}
