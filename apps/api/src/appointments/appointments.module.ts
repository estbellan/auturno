import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [AuthModule, ServicesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}