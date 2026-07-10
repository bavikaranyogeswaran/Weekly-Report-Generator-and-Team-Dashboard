import { Global, Module } from '@nestjs/common';
import { DateUtilsService } from './date-utils.service';

// @Global makes DateUtilsService available in every module without explicit imports
@Global()
@Module({
  providers: [DateUtilsService],
  exports: [DateUtilsService],
})
export class CommonModule {}
