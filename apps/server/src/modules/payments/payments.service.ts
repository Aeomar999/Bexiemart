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
    if (event !== "charge.success") return { received: true };

    const reference = body.data.reference;

    const order = await this.prisma.order.findFirst({
      where: { paystackRef: reference },
    });

    if (!order) throw new NotFoundException("Order not found");

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
    });

    return { received: true };
  }
}
