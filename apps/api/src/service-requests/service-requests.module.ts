import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppointmentsModule } from '../appointments/appointments.module';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { ServicesModule } from '../services/services.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ClientServiceRequestsController } from './client-service-requests.controller';
import {
  ServiceRequest,
  ServiceRequestSchema,
} from './schemas/service-request.schema';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  imports: [
    AuthModule,
    AppointmentsModule,
    CustomersModule,
    ServicesModule,
    VehiclesModule,
    MongooseModule.forFeature([
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
    ]),
  ],
  controllers: [ClientServiceRequestsController, ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
