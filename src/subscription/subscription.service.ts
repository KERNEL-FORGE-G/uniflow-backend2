import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentCurrency, PaymentProvider, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (plans.length === 0) {
      throw new ServiceUnavailableException('Aucun plan d’abonnement actif n’est configuré.');
    }

    return plans.map((plan) => this.serializePlan(plan));
  }

  async getPricing(countryCode = 'CM') {
    const code = countryCode.trim().toUpperCase();
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    const plan = plans.find((item) => item.category === 'PERSONAL') ?? plans[0];
    if (!plan) {
      throw new ServiceUnavailableException('Aucun plan d’abonnement actif n’est configuré.');
    }

    const currency = code === 'CM' ? PaymentCurrency.XAF : PaymentCurrency.EUR;
    const amount = currency === PaymentCurrency.XAF
      ? Number(plan.priceMonthlyXaf)
      : Number(plan.priceMonthlyEur);
    const xafProviders: PaymentProvider[] = [PaymentProvider.MTN_MOMO, PaymentProvider.ORANGE_MONEY, PaymentProvider.NOTCHPAY, PaymentProvider.CINETPAY];
    const eurProviders: PaymentProvider[] = [PaymentProvider.STRIPE, PaymentProvider.CARD];
    const providers = plan.providers.filter((provider) =>
      currency === PaymentCurrency.XAF ? xafProviders.includes(provider) : eurProviders.includes(provider),
    );

    return {
      countryCode: code,
      currency,
      amount,
      formattedPrice: currency === PaymentCurrency.XAF ? `${amount} FCFA / mois` : `${amount.toFixed(2).replace('.', ',')} € / mois`,
      billingInterval: 'MONTHLY',
      providers,
    };
  }

  async checkout(dto: CheckoutDto, userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Une session JWT est requise pour initier un paiement.');
    }

    const user = await this.prisma.personalUser.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, countryCode: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Compte personnel introuvable ou désactivé.');
    }

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        code: dto.planCode,
        isActive: true,
      },
    });
    if (!plan) {
      throw new NotFoundException('Le plan d’abonnement demandé est introuvable ou inactif.');
    }

    const countryCode = (dto.countryCode || user.countryCode || 'CM').toUpperCase();
    const currency = countryCode === 'CM' ? PaymentCurrency.XAF : PaymentCurrency.EUR;
    const provider = dto.paymentProvider ?? plan.providers[0];
    if (!provider || !plan.providers.includes(provider)) {
      throw new BadRequestException('Le moyen de paiement n’est pas disponible pour ce plan.');
    }
    if ((provider === PaymentProvider.MTN_MOMO || provider === PaymentProvider.ORANGE_MONEY) && !dto.phoneNumber) {
      throw new BadRequestException('Un numéro de téléphone est requis pour ce moyen de paiement.');
    }

    const billingCycle = dto.billingCycle ?? 'monthly';
    const amount = currency === PaymentCurrency.XAF
      ? billingCycle === 'annually' ? Number(plan.priceAnnuallyXaf) : Number(plan.priceMonthlyXaf)
      : billingCycle === 'annually' ? Number(plan.priceAnnuallyEur) : Number(plan.priceMonthlyEur);

    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planCode: plan.code,
        status: SubscriptionStatus.PENDING,
        countryCode,
        currency,
        monthlyAmount: currency === PaymentCurrency.XAF ? Number(plan.priceMonthlyXaf) : Number(plan.priceMonthlyEur),
        paymentProvider: provider,
      },
      update: {
        planCode: plan.code,
        status: SubscriptionStatus.PENDING,
        countryCode,
        currency,
        monthlyAmount: currency === PaymentCurrency.XAF ? Number(plan.priceMonthlyXaf) : Number(plan.priceMonthlyEur),
        paymentProvider: provider,
      },
    });

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        amount,
        currency,
        provider,
        status: 'PENDING',
        metadata: {
          billingCycle,
          phoneNumber: dto.phoneNumber ?? null,
          planCode: plan.code,
        } satisfies Prisma.InputJsonValue,
      },
    });

    return {
      transactionId: transaction.id,
      status: 'PENDING',
      message: 'Transaction enregistrée. La confirmation dépend du prestataire de paiement configuré.',
    };
  }

  async getStatus(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Une session JWT est requise pour consulter un abonnement.');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return {
        status: 'NONE',
        planCode: null,
        countryCode: null,
        currency: null,
        monthlyAmount: null,
        currentPeriodEnd: null,
        isAutoRenew: false,
      };
    }

    return {
      status: subscription.status,
      planCode: subscription.planCode,
      countryCode: subscription.countryCode,
      currency: subscription.currency,
      monthlyAmount: Number(subscription.monthlyAmount),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      isAutoRenew: !subscription.cancelAtPeriodEnd,
    };
  }

  private serializePlan(plan: {
    id: string;
    code: string;
    name: string;
    category: string;
    description: string | null;
    priceMonthlyXaf: Prisma.Decimal;
    priceAnnuallyXaf: Prisma.Decimal;
    priceMonthlyEur: Prisma.Decimal;
    priceAnnuallyEur: Prisma.Decimal;
    period: string | null;
    features: Prisma.JsonValue;
    providers: PaymentProvider[];
    btnText: string | null;
    btnVariant: string | null;
    highlight: boolean;
    badge: string | null;
  }) {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      category: plan.category,
      priceMonthly: `${Number(plan.priceMonthlyXaf)} FCFA / mois`,
      priceAnnually: `${Number(plan.priceAnnuallyXaf)} FCFA / an`,
      priceMonthlyAmount: Number(plan.priceMonthlyXaf),
      priceAnnuallyAmount: Number(plan.priceAnnuallyXaf),
      amountXAF: Number(plan.priceMonthlyXaf),
      amountEUR: Number(plan.priceMonthlyEur),
      period: plan.period ?? 'Tarif configuré en base de données',
      description: plan.description ?? '',
      features: Array.isArray(plan.features) ? plan.features : [],
      providers: plan.providers,
      btnText: plan.btnText ?? 'Souscrire à cette offre',
      btnVariant: plan.btnVariant ?? 'primary',
      highlight: plan.highlight,
      badge: plan.badge ?? undefined,
    };
  }
}
