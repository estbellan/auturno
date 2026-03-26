import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Quote, QuoteSchema } from '../quotes/schemas/quote.schema';
import { ServicesModule } from '../services/services.module';
import { Vehicle, VehicleSchema } from '../vehicles/schemas/vehicle.schema';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WorkOrder, WorkOrderSchema } from './schemas/work-order.schema';
import { ClientPortalController } from './client-portal.controller';
import { WorkOrderTrackingController } from './work-order-tracking.controller';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    AppointmentsModule,
    CustomersModule,
    NotificationsModule,
    ServicesModule,
    VehiclesModule,
    MongooseModule.forFeature([
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
  ],
  controllers: [
    WorkOrdersController,
    WorkOrderTrackingController,
    ClientPortalController,
  ],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
