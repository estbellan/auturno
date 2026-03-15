import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @IsDateString()
  scheduledStartAt!: string;
}
