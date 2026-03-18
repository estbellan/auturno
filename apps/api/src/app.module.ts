import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AuditModule } from './audit/audit.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { QuotesModule } from './quotes/quotes.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { WorkshopsModule } from './workshops/workshops.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    AuditModule,
    AuthModule,
    UsersModule,
    WorkshopsModule,
    ServicesModule,
    CustomersModule,
    VehiclesModule,
    AppointmentsModule,
    WorkOrdersModule,
    DiagnosticsModule,
    QuotesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
