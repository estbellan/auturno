import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  create(workshopId: string, payload: CreateUserDto) {
    return this.userModel.create({ ...payload, workshopId, authProvider: 'auth0' });
  }

  findByWorkshop(workshopId: string) {
    return this.userModel.find({ workshopId }).sort({ createdAt: -1 }).lean();
  }
}
