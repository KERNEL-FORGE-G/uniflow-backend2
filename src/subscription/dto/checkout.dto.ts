import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class CheckoutDto {
  @ApiProperty({ example: 'pass-etudiant', description: 'Code du plan actif en base de données' })
  @IsString()
  @IsNotEmpty()
  planCode!: string;

  @ApiProperty({ example: 'monthly', enum: ['monthly', 'annually'] })
  @IsIn(['monthly', 'annually'])
  billingCycle!: 'monthly' | 'annually';

  @ApiProperty({ example: 'CM', description: 'Code pays (ex: CM, FR)' })
  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @ApiPropertyOptional({
    enum: PaymentProvider,
    example: PaymentProvider.NOTCHPAY,
    description: 'Fournisseur de paiement configuré pour le plan',
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

  @ApiPropertyOptional({ example: 'Jean Dupont' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'jean@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
