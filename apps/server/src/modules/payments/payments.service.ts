import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { InitializePaymentDto } from "./dto/initialize-payment.dto";

@Injectable()
export class PaymentsService {
  private readonly paystackSecret: string;
  private readonly paystackApi = "https://api.paystack.co";

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.paystackSecret = this.config.get<string>("PAYSTACK_SECRET_KEY") ?? "";
  }

  private async paystackPost(path: string, data: any) {
    const res = await fetch(`${this.paystackApi}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  private async paystackGet(path: string) {
    const res = await fetch(`${this.paystackApi}${path}`, {
      headers: { Authorization: `Bearer ${this.paystackSecret}` },
    });
    return res.json();
  }

  async initialize(userId: string, dto: InitializePaymentDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.paymentStatus !== "pending") {
      throw new BadRequestException("Payment already processed for this order");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const response = await this.paystackPost("/transaction/initialize", {
      email: user.email,
      amount: Math.round(Number(order.total) * 100),
      reference: `BEX-${order.id}-${Date.now()}`,
      callback_url: dto.callbackUrl ?? `${this.config.get("BETTER_AUTH_URL")}/payment/callback`,
      metadata: { orderId: order.id, userId },
    });

    if (!response.status) {
      throw new BadRequestException(response.message ?? "Paystack initialization failed");
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paystackRef: response.data.reference },
    });

    return {
      authorizationUrl: response.data.authorization_url,
      reference: response.data.reference,
    };
  }

  async verify(userId: string, reference: string) {
    const response = await this.paystackGet(`/transaction/verify/${encodeURIComponent(reference)}`);

    if (!response.status) {
      throw new BadRequestException("Payment verification failed");
    }

    const { data } = response;

    const order = await this.prisma.order.findFirst({
      where: { paystackRef: reference, userId },
    });

    if (!order) throw new NotFoundException("Order not found");

    const paymentStatus = data.status === "success" ? "success" : "failed";

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus,
          paymentMethod: data.channel,
          status: paymentStatus === "success" ? "confirmed" : "pending",
        },
      });

      await tx.payment.upsert({
        where: { orderId: order.id },
        update: {
          status: paymentStatus,
          paystackTxRef: data.reference,
          channel: data.channel,
          paidAt: data.paidAt ? new Date(data.paidAt) : null,
        },
        create: {
          orderId: order.id,
          userId,
          amount: data.amount / 100,
          currency: data.currency,
          status: paymentStatus,
          paystackRef: reference,
          paystackTxRef: data.reference,
          channel: data.channel,
          paidAt: data.paidAt ? new Date(data.paidAt) : null,
        },
      });
    });

    return {
      status: paymentStatus,
      reference,
      orderId: order.id,
    };
  }

  async handleWebhook(body: any) {
    const event = body.event;
    
    // Handle Transfer Events
    if (event === "transfer.success" || event === "transfer.failed" || event === "transfer.reversed") {
      const reference = body.data.reference;
      const transaction = await this.prisma.transaction.findUnique({
        where: { reference },
      });

      if (!transaction || transaction.type !== "WITHDRAWAL") {
        return { received: true };
      }

      if (event === "transfer.success") {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "COMPLETED" },
        });
      } else {
        // Failed or reversed: Refund the amount + fee back to the wallet
        await this.prisma.$transaction([
          this.prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: event === "transfer.failed" ? "FAILED" : "REVERSED" },
          }),
          this.prisma.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { increment: transaction.amount } }, // refund the total deducted
          }),
        ]);
      }
      return { received: true };
    }

    if (event !== "charge.success") return { received: true };

    const reference = body.data.reference;

    // Check if it's a top-up
    if (reference.startsWith("tu_")) {
      const transaction = await this.prisma.transaction.findUnique({
        where: { reference },
      });
      if (transaction && transaction.status === "PENDING") {
        await this.prisma.$transaction([
          this.prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: "COMPLETED" },
          }),
          this.prisma.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { increment: transaction.amount } },
          }),
        ]);
      }
      return { received: true };
    }

    // Otherwise, assume it's an order checkout
    const order = await this.prisma.order.findFirst({
      where: { paystackRef: reference },
    });

    if (!order) return { received: true }; // Don't throw NotFound here, just acknowledge

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "success",
          paymentMethod: body.data.channel,
          status: "confirmed",
        },
      });

      await tx.payment.upsert({
        where: { orderId: order.id },
        update: {
          status: "success",
          paystackTxRef: body.data.reference,
          channel: body.data.channel,
          paidAt: body.data.paidAt ? new Date(body.data.paidAt) : null,
        },
        create: {
          orderId: order.id,
          userId: order.userId,
          amount: body.data.amount / 100,
          currency: body.data.currency,
          status: "success",
          paystackRef: reference,
          paystackTxRef: body.data.reference,
          channel: body.data.channel,
          paidAt: body.data.paidAt ? new Date(body.data.paidAt) : null,
        },
      });

      // Create Escrow since order is paid
      const adminWallet = await tx.wallet.findFirst(); // In real app, identify the central admin or just buyer wallet
      // But according to existing Escrow setup, it just needs buyerWalletId
      const buyerWallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
      if (buyerWallet) {
         await tx.escrow.create({
           data: {
             orderId: order.id,
             buyerWalletId: buyerWallet.id,
             amount: order.total,
             netAmount: order.total, // Before commission is calculated
             status: "HELD",
           }
         });
      }
    });

    return { received: true };
  }

  async chargeAuthorization(userId: string, orderId: string, cardId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.paymentStatus !== "pending") {
      throw new BadRequestException("Payment already processed for this order");
    }

    const card = await this.prisma.card.findFirst({
      where: { id: cardId, wallet: { userId } },
      include: { wallet: { include: { user: true } } },
    });

    if (!card || !card.authorizationCode) {
      throw new BadRequestException("Valid saved card not found");
    }

    const reference = `BEX-${order.id}-${Date.now()}`;

    const response = await this.paystackPost("/transaction/charge_authorization", {
      email: card.wallet.user.email,
      amount: Math.round(Number(order.total) * 100),
      authorization_code: card.authorizationCode,
      reference,
    });

    if (!response.status) {
      throw new BadRequestException(response.message || "Failed to charge card");
    }

    // It might be immediately successful
    if (response.data?.status === "success") {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "success",
            paymentMethod: response.data.channel || "card",
            status: "confirmed",
            paystackRef: reference,
          },
        });

        await tx.payment.upsert({
          where: { orderId: order.id },
          update: {
            status: "success",
            paystackTxRef: response.data.reference,
            channel: response.data.channel || "card",
            paidAt: new Date(),
          },
          create: {
            orderId: order.id,
            userId,
            amount: Number(order.total),
            currency: "GHS",
            status: "success",
            paystackRef: reference,
            paystackTxRef: response.data.reference,
            channel: response.data.channel || "card",
            paidAt: new Date(),
          },
        });

        const buyerWallet = await tx.wallet.findUnique({ where: { userId } });
        if (buyerWallet) {
           await tx.escrow.create({
             data: {
               orderId: order.id,
               buyerWalletId: buyerWallet.id,
               amount: order.total,
               netAmount: order.total,
               status: "HELD",
             }
           });
        }
      });
      
      return { status: "success", reference, orderId: order.id };
    }

    return { status: response.data?.status || "pending", reference, orderId: order.id };
  }
}
