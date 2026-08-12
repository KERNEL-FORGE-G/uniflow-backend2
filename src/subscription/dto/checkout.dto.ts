import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class CheckoutDto {
  @ApiProperty({ example: 'CM', description: 'Code pays (ex: CM, FR)' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiPropertyOptional({
    enum: PaymentProvider,
    example: PaymentProvider.NOTCHPAY,
    description: 'Fournisseur de paiement',
  })
  @IsEnum(PaymentProvider)
  @IsOptional()
  paymentProvider?: PaymentProvider;

  @ApiPropertyOptional({
    example: '+237678901234',
    description: 'Numéro de téléphone pour Mobile Money',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
