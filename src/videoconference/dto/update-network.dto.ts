import { IsString } from 'class-validator';

export class UpdateNetworkDto {
  @IsString()
  publicUrl!: string; // ex: "https://abcd-1234.ngrok-free.app" fourni par le client Desktop après activation de ngrok
}
