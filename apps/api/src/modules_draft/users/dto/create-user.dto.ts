import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { ROLES } from '../../../common/constants/roles.constants';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  authSubject!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @IsEnum(ROLES, { each: true })
  roles!: (typeof ROLES)[number][];

  @IsArray()
  @IsEnum(PERMISSIONS, { each: true })
  permissions!: (typeof PERMISSIONS)[number][];
}
