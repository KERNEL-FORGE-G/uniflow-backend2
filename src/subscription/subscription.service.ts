import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { PaymentCurrency, PaymentProvider, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  getPricing(countryCode: string = 'CM') {
    const code = countryCode.toUpperCase();
    if (code === 'CM') {
      return {
        countryCode: 'CM',
        currency: 'XAF',
        amount: 100,
        formattedPrice: '100 FCFA / mois',
        billingInterval: 'MONTHLY',
        providers: ['MTN_MOMO', 'ORANGE_MONEY', 'NOTCHPAY'],
      };
    }

    return {
      countryCode: code,
      currency: 'EUR',
      amount: 1.00,
      formattedPrice: '1,00 € / mois',
      billingInterval: 'MONTHLY',
      providers: ['STRIPE', 'CARD'],
    };
  }

  async checkout(dto: CheckoutDto, userId?: string) {
    const isCM = dto.countryCode?.toUpperCase() === 'CM';
    const txId = `tx_${isCM ? 'cm' : 'eur'}_${Date.now()}`;

    let targetUserId = userId;
    if (!targetUserId) {
      // Find or create default personal user if none provided
      let user = await this.prisma.personalUser.findFirst();
      if (!user) {
        user = await this.prisma.personalUser.create({
          data: {
            email: 'demo.solo@uniflow.app',
            passwordHash: 'hashed_demo_pwd',
            firstName: 'Jean',
            lastName: 'Independant',
            countryCode: dto.countryCode || 'CM',
            preferredCurrency: isCM ? PaymentCurrency.XAF : PaymentCurrency.EUR,
          },
        });
      }
      targetUserId = user.id;
    }

    // Ensure user subscription record exists
    let sub = await this.prisma.subscription.findUnique({
      where: { userId: targetUserId },
    });

    if (!sub) {
      sub = await this.prisma.subscription.create({
        data: {
          userId: targetUserId,
          status: SubscriptionStatus.TRIAL,
          countryCode: dto.countryCode || 'CM',
          currency: isCM ? PaymentCurrency.XAF : PaymentCurrency.EUR,
          monthlyAmount: isCM ? 100.0 : 1.0,
          paymentProvider: dto.paymentProvider || (isCM ? PaymentProvider.NOTCHPAY : PaymentProvider.STRIPE),
        },
      });
    }

    // Record transaction
    await this.prisma.paymentTransaction.create({
      data: {
        id: txId,
        subscriptionId: sub.id,
        userId: targetUserId,
        amount: isCM ? 100.0 : 1.0,
        currency: isCM ? PaymentCurrency.XAF : PaymentCurrency.EUR,
        provider: dto.paymentProvider || (isCM ? PaymentProvider.NOTCHPAY : PaymentProvider.STRIPE),
        status: 'PENDING',
        metadata: { phoneNumber: dto.phoneNumber || null },
      },
    });

    const paymentUrl = isCM
      ? `https://pay.notchpay.co/checkout/${txId}`
      : `https://checkout.stripe.com/pay/${txId}`;

    return {
      transactionId: txId,
      paymentUrl,
      status: 'PENDING',
      message: isCM
        ? 'Veuillez valider le retrait Mobile Money sur votre téléphone.'
        : 'Redirection vers la page de paiement sécurisée par carte.',
    };
  }

  async getStatus(userId?: string) {
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await this.prisma.personalUser.findFirst();
      if (user) targetUserId = user.id;
    }

    if (targetUserId) {
      const sub = await this.prisma.subscription.findUnique({
        where: { userId: targetUserId },
      });

      if (sub) {
        return {
          status: sub.status,
          countryCode: sub.countryCode,
          currency: sub.currency,
          monthlyAmount: Number(sub.monthlyAmount),
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
          isAutoRenew: !sub.cancelAtPeriodEnd,
        };
      }
    }

    // Default response matching docu.md
    return {
      status: 'ACTIVE',
      countryCode: 'CM',
      currency: 'XAF',
      monthlyAmount: 100,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isAutoRenew: true,
    };
  }
}
