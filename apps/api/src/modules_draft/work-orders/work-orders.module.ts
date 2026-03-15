import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { WorkOrder, WorkOrderSchema } from './schemas/work-order.schema';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: WorkOrder.name, schema: WorkOrderSchema }])],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
