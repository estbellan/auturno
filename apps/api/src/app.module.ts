import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkshopsModule } from './workshops/workshops.module';
import { ServicesModule } from './services/services.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    WorkshopsModule,
    ServicesModule,
    AppointmentsModule,
    WorkOrdersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
