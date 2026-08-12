import { IsString } from 'class-validator';

export class SetLocalUrlDto {
  @IsString()
  localUrl: string; // ex: "ws://192.168.1.42:7880"
}
