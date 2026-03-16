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
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuotesService } from './quotes.service';

@Controller('quotes')
@UseGuards(AuthGuard, PermissionsGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post('from-diagnostic/:diagnosticId')
  @RequirePermissions('quotes.write')
  async createFromDiagnostic(
    @CurrentUser() user: CurrentUserContext,
    @Param('diagnosticId') diagnosticId: string,
    @Body() input: CreateQuoteDto,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.quotesService.createFromDiagnostic(
      user.workshopId,
      diagnosticId,
      user.id,
      input,
    );
  }

  @Patch(':id/send')
  @RequirePermissions('quotes.write')
  async sendQuote(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') quoteId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.quotesService.sendQuote(user.workshopId, quoteId, user.id);
  }

  @Patch(':id/approve')
  @RequirePermissions('quotes.write')
  async approveQuote(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') quoteId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.quotesService.approveQuote(
      user.workshopId,
      quoteId,
      user.id,
    );
  }

  @Patch(':id/reject')
  @RequirePermissions('quotes.write')
  async rejectQuote(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') quoteId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.quotesService.rejectQuote(
      user.workshopId,
      quoteId,
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

    return await this.quotesService.findByWorkOrderId(
      user.workshopId,
      workOrderId,
    );
  }
}
