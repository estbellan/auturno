import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkshopsModule } from './modules/workshops/workshops.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { DiagnosticsModule } from './modules/diagnostics/diagnostics.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/auturno'),
    AuthModule,
    UsersModule,
    WorkshopsModule,
    ServicesModule,
    AppointmentsModule,
    WorkOrdersModule,
    DiagnosticsModule,
    QuotesModule,
    LoyaltyModule,
    AuditModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
