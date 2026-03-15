import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ServicesModule } from '../services/services.module';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [AppointmentsModule, ServicesModule, AuthModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
})
export class WorkOrdersModule {}
