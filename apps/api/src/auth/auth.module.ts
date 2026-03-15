import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, UsersModule],
})
export class AuthModule {}