import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Workshop, WorkshopSchema } from './schemas/workshop.schema';
import { WorkshopsService } from './workshops.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Workshop.name, schema: WorkshopSchema }])],
  providers: [WorkshopsService],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}
