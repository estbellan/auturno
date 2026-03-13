import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { WorkOrder, WorkOrderDocument } from './schemas/work-order.schema';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectModel(WorkOrder.name) private readonly workOrderModel: Model<WorkOrderDocument>,
  ) {}

  create(workshopId: string, payload: CreateWorkOrderDto) {
    const isDiagnostic = payload.type === 'diagnostic';

    return this.workOrderModel.create({
      workshopId,
      ...payload,
      phase: isDiagnostic ? 'reception' : 'scheduled',
      estimatedDiagnosticHours: payload.estimatedDiagnosticHours ?? 0,
      estimatedOperationHours: payload.estimatedOperationHours ?? 0,
      promisedDiagnosticAt: isDiagnostic ? new Date() : undefined,
      promisedDeliveryAt: new Date(),
    });
  }

  findOneByWorkshop(workshopId: string, workOrderId: string) {
    return this.workOrderModel.findOne({ _id: workOrderId, workshopId }).lean();
  }
}
