import { Module } from '@nestjs/common';
import { UeService } from './ue.service';
import { UeController } from './ue.controller';

@Module({
  providers: [UeService],
  controllers: [UeController],
})
export class UeModule {}
