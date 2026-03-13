import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ServiceCatalog, ServiceCatalogSchema } from './schemas/service-catalog.schema';
import { ServicesService } from './services.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ServiceCatalog.name, schema: ServiceCatalogSchema }]),
  ],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
