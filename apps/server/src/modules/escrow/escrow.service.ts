import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminGateway } from "../admin/admin.gateway";

@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminGateway: AdminGateway
  ) {}

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
      include: { vendor: true },
    });

    if (!escrow) throw new NotFoundException("Escrow not found");
    if (escrow.status !== "HELD") throw new BadRequestException("Escrow is not in HELD status");

    if (!escrow.vendor || escrow.vendor.userId !== userId) {
      throw new ForbiddenException("Only the vendor can release escrow");
    }

    const vendorWallet = await this.prisma.wallet.findUnique({
      where: { userId: escrow.vendor.userId },
    });

    if (!vendorWallet) throw new BadRequestException("Vendor wallet not found");

    if (!escrow.vendorWalletId) {
      await this.prisma.escrow.update({
        where: { id },
        data: { vendorWalletId: vendorWallet.id },
      });
    }

    const reference = `esc_rel_${id}_${Date.now()}`;

    const updatedEscrow = await this.prisma.$transaction(
      async (tx) => {
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

        return tx.escrow.update({
          where: { id },
          data: {
            status: "RELEASED",
            releasedAt: new Date(),
            releasedTxnId: txn.id,
            vendorWalletId: vendorWallet.id,
          },
        });
      },
      { isolationLevel: "Serializable" }
    );

    return updatedEscrow;
  }

  async refund(userId: string, id: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
    });

    if (!escrow) throw new NotFoundException("Escrow not found");
    if (escrow.status !== "HELD") throw new BadRequestException("Escrow is not in HELD status");

    const buyerWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!buyerWallet || buyerWallet.id !== escrow.buyerWalletId) {
      throw new ForbiddenException("Only the buyer can refund escrow");
    }

    const reference = `esc_ref_${id}_${Date.now()}`;

    const updatedEscrow = await this.prisma.$transaction(
      async (tx) => {
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

        return tx.escrow.update({
          where: { id },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
            refundedTxnId: txn.id,
          },
        });
      },
      { isolationLevel: "Serializable" }
    );

    return updatedEscrow;
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
