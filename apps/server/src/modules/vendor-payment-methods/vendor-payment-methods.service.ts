import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VendorPaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException("Wallet not found");
    const [bankAccounts, momoAccounts] = await Promise.all([
      this.prisma.bankAccount.findMany({ where: { walletId: wallet.id } }),
      this.prisma.momoAccount.findMany({ where: { walletId: wallet.id } }),
    ]);
    return {
      bankAccounts: bankAccounts.map((b) => ({ id: b.id, type: "bank", bankName: b.bankName, bankCode: b.bankCode, accountNumber: b.accountNumber.slice(-4).padStart(b.accountNumber.length, "*"), accountName: b.accountName, isDefault: b.isDefault, isVerified: b.isVerified })),
      momoAccounts: momoAccounts.map((m) => ({ id: m.id, type: "momo", provider: m.provider, phoneNumber: m.phoneNumber.slice(-4).padStart(m.phoneNumber.length, "*"), accountName: m.accountName, isDefault: m.isDefault, isVerified: m.isVerified })),
    };
  }

  private async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({ data: { userId } });
    }
    return wallet;
  }

  async addBank(userId: string, data: { bankName: string; bankCode: string; accountNumber: string; accountName: string }) {
    const wallet = await this.getOrCreateWallet(userId);
    const isFirst = (await this.prisma.bankAccount.count({ where: { walletId: wallet.id } })) === 0;
    return this.prisma.bankAccount.create({ data: { walletId: wallet.id, ...data, isDefault: isFirst } });
  }

  async addMomo(userId: string, data: { provider: string; phoneNumber: string; accountName: string }) {
    const wallet = await this.getOrCreateWallet(userId);
    const existing = await this.prisma.momoAccount.findUnique({ where: { walletId_phoneNumber: { walletId: wallet.id, phoneNumber: data.phoneNumber } } });
    if (existing) throw new BadRequestException("This phone number is already added");
    const isFirst = (await this.prisma.momoAccount.count({ where: { walletId: wallet.id } })) === 0;
    return this.prisma.momoAccount.create({ data: { walletId: wallet.id, ...data, isDefault: isFirst } as any });
  }

  async remove(userId: string, type: string, id: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException("Wallet not found");
    if (type === "bank") {
      const acc = await this.prisma.bankAccount.findFirst({ where: { id, walletId: wallet.id } });
      if (!acc) throw new NotFoundException("Bank account not found");
      await this.prisma.bankAccount.delete({ where: { id } });
    } else {
      const acc = await this.prisma.momoAccount.findFirst({ where: { id, walletId: wallet.id } });
      if (!acc) throw new NotFoundException("Mobile money account not found");
      await this.prisma.momoAccount.delete({ where: { id } });
    }
    return { success: true };
  }

  async setDefault(userId: string, type: string, id: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException("Wallet not found");
    if (type === "bank") {
      await this.prisma.bankAccount.updateMany({ where: { walletId: wallet.id }, data: { isDefault: false } });
      return this.prisma.bankAccount.update({ where: { id }, data: { isDefault: true } });
    }
    await this.prisma.momoAccount.updateMany({ where: { walletId: wallet.id }, data: { isDefault: false } });
    return this.prisma.momoAccount.update({ where: { id }, data: { isDefault: true } });
  }
}
