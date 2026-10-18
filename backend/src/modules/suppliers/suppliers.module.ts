import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SuppliersController } from './suppliers.controller';
import { SupplyConditionsController } from './supply-conditions.controller';
import { SuppliersService } from './suppliers.service';
import { SupplyConditionsService } from './supply-conditions.service';

@Module({
  imports: [PrismaModule],
  controllers: [SuppliersController, SupplyConditionsController],
  providers: [SuppliersService, SupplyConditionsService],
  exports: [SuppliersService, SupplyConditionsService],
})
export class SuppliersModule {}
