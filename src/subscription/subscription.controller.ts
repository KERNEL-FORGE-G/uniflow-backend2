import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CheckoutDto } from './dto/checkout.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Subscription & Pricing')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Lister les offres d abonnement disponibles en BD' })
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Public()
  @Get('pricing')
  @ApiOperation({ summary: 'Obtenir la grille tarifaire selon le pays' })
  @ApiQuery({ name: 'countryCode', required: false, example: 'CM' })
  getPricing(@Query('countryCode') countryCode?: string) {
    return this.subscriptionService.getPricing(countryCode);
  }

  @Post('checkout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initier un paiement d abonnement' })
  checkout(@Body() dto: CheckoutDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.subscriptionService.checkout(dto, userId);
  }

  @Get('status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Vérifier le statut de abonnement de l utilisateur' })
  getStatus(@Req() req: any) {
    const userId = req.user?.userId;
    return this.subscriptionService.getStatus(userId);
  }
}
