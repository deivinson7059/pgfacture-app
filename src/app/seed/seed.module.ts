import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { AccountingModule } from 'src/app/accounting/accounting.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [AccountingModule]
})
export class SeedModule {}
