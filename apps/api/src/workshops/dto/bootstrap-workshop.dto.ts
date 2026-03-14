import { IsNotEmpty, IsString } from 'class-validator';

export class BootstrapWorkshopDto {
  @IsString()
  @IsNotEmpty()
  workshopName!: string;
}
