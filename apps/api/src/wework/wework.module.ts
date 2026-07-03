import { Global, Module } from '@nestjs/common';
import { WeworkService } from './wework.service';
import { WeworkController } from './wework.controller';

@Global()
@Module({
  providers: [WeworkService],
  controllers: [WeworkController],
  exports: [WeworkService],
})
export class WeworkModule {}
