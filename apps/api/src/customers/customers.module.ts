import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
