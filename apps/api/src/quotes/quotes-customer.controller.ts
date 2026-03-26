import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserContext } from '../auth/types';
import { CustomerQuoteResponseDto } from './dto/customer-quote-response.dto';
import { QuotesService } from './quotes.service';

@Controller('quotes')
@UseGuards(AuthGuard)
export class QuotesCustomerController {
  constructor(private readonly quotesService: QuotesService) {}

  @Patch(':id/customer-response')
  async customerResponse(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') quoteId: string,
    @Body() input: CustomerQuoteResponseDto,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.quotesService.respondFromClientPortal(
      user.workshopId,
      quoteId,
      user,
      input,
    );
  }
}
