import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CurrentUserContext } from '../auth/types';
import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';
import { DiagnosticsService } from './diagnostics.service';

@Controller('diagnostics')
@UseGuards(AuthGuard, PermissionsGuard)
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post('work-order/:workOrderId')
  @RequirePermissions('diagnostics.write')
  async createDraft(
    @CurrentUser() user: CurrentUserContext,
    @Param('workOrderId') workOrderId: string,
    @Body() input: CreateDiagnosticDto,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.diagnosticsService.createDraft(
      user.workshopId,
      workOrderId,
      user.id,
      input,
    );
  }

  @Patch(':id/complete')
  @RequirePermissions('diagnostics.write')
  async completeDiagnostic(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') diagnosticId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.diagnosticsService.completeDiagnostic(
      user.workshopId,
      diagnosticId,
      user.id,
    );
  }

  @Get('work-order/:workOrderId')
  @RequirePermissions('workorders.read')
  async findByWorkOrderId(
    @CurrentUser() user: CurrentUserContext,
    @Param('workOrderId') workOrderId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.diagnosticsService.findByWorkOrderId(
      user.workshopId,
      workOrderId,
    );
  }
}
