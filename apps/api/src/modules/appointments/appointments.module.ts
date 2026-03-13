import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Appointment.name, schema: AppointmentSchema }])],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
