import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuditService } from '../audit/audit.service';
import { CurrentUserContext } from '../auth/types';
import { CustomersService } from '../customers/customers.service';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { CustomerQuoteResponseDto } from './dto/customer-quote-response.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteEntity, QuoteItemEntity } from './quote.entity';
import { Quote, QuoteDocument } from './schemas/quote.schema';

@Injectable()
export class QuotesService {
  constructor(
    @InjectModel(Quote.name)
    private readonly quoteModel: Model<QuoteDocument>,
    private readonly auditService: AuditService,
    private readonly customersService: CustomersService,
    private readonly diagnosticsService: DiagnosticsService,
    private readonly notificationsService: NotificationsService,
    private readonly workOrdersService: WorkOrdersService,
  ) {}

  async createFromDiagnostic(
    workshopId: string,
    diagnosticId: string,
    createdByUserId: string,
    input: CreateQuoteDto,
  ): Promise<QuoteEntity> {
    const diagnostic = await this.diagnosticsService.findByIdInWorkshop(
      workshopId,
      diagnosticId,
    );

    if (diagnostic.status !== 'completed') {
      throw new ConflictException(
        'Quote can only be created from a completed diagnostic.',
      );
    }

    const workOrder = await this.workOrdersService.findByIdInWorkshop(
      workshopId,
      diagnostic.workOrderId,
    );

    if (workOrder.type !== 'diagnostic') {
      throw new ConflictException(
        'Quotes are only allowed for diagnostic work orders.',
      );
    }

    if (workOrder.status !== 'in_diagnosis') {
      throw new ConflictException(
        `Quote draft cannot be created while work order is ${workOrder.status}.`,
      );
    }

    const existing = await this.quoteModel
      .findOne({
        workshopId,
        workOrderId: diagnostic.workOrderId,
      })
      .exec();

    if (existing) {
      throw new ConflictException(
        'A quote already exists for this work order.',
      );
    }

    const pricedItems = input.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));
    const subtotal = pricedItems.reduce((sum, item) => sum + item.total, 0);

    const created = await this.quoteModel.create({
      workshopId,
      workOrderId: diagnostic.workOrderId,
      diagnosticId: diagnostic.id,
      status: 'draft',
      items: pricedItems,
      subtotal,
      total: subtotal,
      sentAt: null,
      respondedAt: null,
      createdByUserId,
    });

    await this.auditService.create({
      workshopId,
      entityType: 'quote',
      entityId: created._id.toString(),
      action: 'quote_created',
      actorUserId: createdByUserId,
      metadata: {
        workOrderId: created.workOrderId,
        diagnosticId: created.diagnosticId,
        total: created.total,
      },
    });

    return this.toEntity(created);
  }

  async sendQuote(
    workshopId: string,
    quoteId: string,
    actorUserId: string,
  ): Promise<QuoteEntity> {
    const quote = await this.findDocumentByIdInWorkshop(workshopId, quoteId);

    if (quote.status === 'sent') {
      return this.toEntity(quote);
    }

    if (quote.status !== 'draft') {
      throw new ConflictException(
        `Only draft quotes can be sent, received ${quote.status}.`,
      );
    }

    await this.assertDiagnosticWorkOrderReadyForQuoteAction(
      workshopId,
      quote.workOrderId,
      quote.diagnosticId,
      ['in_diagnosis', 'quote_sent'],
    );

    quote.status = 'sent';
    quote.sentAt = quote.sentAt ?? new Date();
    await quote.save();

    const workOrder = await this.workOrdersService.findByIdInWorkshop(
      workshopId,
      quote.workOrderId,
    );

    if (workOrder.status === 'in_diagnosis') {
      await this.workOrdersService.updateStatusInWorkshop(
        workshopId,
        quote.workOrderId,
        'quote_sent',
        actorUserId,
      );
    }

    await this.auditService.create({
      workshopId,
      entityType: 'quote',
      entityId: quote._id.toString(),
      action: 'quote_sent',
      actorUserId,
      metadata: {
        workOrderId: quote.workOrderId,
        sentAt: quote.sentAt?.toISOString() ?? null,
      },
    });

    await this.notificationsService.registerQuoteSent(
      workshopId,
      quote.workOrderId,
    );

    return this.toEntity(quote);
  }

  async approveQuote(
    workshopId: string,
    quoteId: string,
    actorUserId: string,
    metadata?: Record<string, unknown>,
  ): Promise<QuoteEntity> {
    const quote = await this.findDocumentByIdInWorkshop(workshopId, quoteId);

    if (quote.status === 'approved') {
      return this.toEntity(quote);
    }

    if (quote.status !== 'sent') {
      throw new ConflictException(
        `Only sent quotes can be approved, received ${quote.status}.`,
      );
    }

    await this.assertDiagnosticWorkOrderReadyForQuoteAction(
      workshopId,
      quote.workOrderId,
      quote.diagnosticId,
      ['quote_sent', 'awaiting_approval'],
    );

    quote.status = 'approved';
    quote.respondedAt = new Date();
    await quote.save();

    await this.workOrdersService.updateStatusInWorkshop(
      workshopId,
      quote.workOrderId,
      'in_operation',
      actorUserId,
      metadata,
    );

    await this.auditService.create({
      workshopId,
      entityType: 'quote',
      entityId: quote._id.toString(),
      action: 'quote_approved',
      actorUserId,
      metadata: {
        workOrderId: quote.workOrderId,
        respondedAt: quote.respondedAt?.toISOString() ?? null,
        ...(metadata ?? {}),
      },
    });

    return this.toEntity(quote);
  }

  async rejectQuote(
    workshopId: string,
    quoteId: string,
    actorUserId: string,
    metadata?: Record<string, unknown>,
  ): Promise<QuoteEntity> {
    const quote = await this.findDocumentByIdInWorkshop(workshopId, quoteId);

    if (quote.status === 'rejected') {
      return this.toEntity(quote);
    }

    if (quote.status !== 'sent') {
      throw new ConflictException(
        `Only sent quotes can be rejected, received ${quote.status}.`,
      );
    }

    await this.assertDiagnosticWorkOrderReadyForQuoteAction(
      workshopId,
      quote.workOrderId,
      quote.diagnosticId,
      ['quote_sent', 'awaiting_approval'],
    );

    quote.status = 'rejected';
    quote.respondedAt = new Date();
    await quote.save();

    await this.workOrdersService.updateStatusInWorkshop(
      workshopId,
      quote.workOrderId,
      'closed',
      actorUserId,
      metadata,
    );

    await this.auditService.create({
      workshopId,
      entityType: 'quote',
      entityId: quote._id.toString(),
      action: 'quote_rejected',
      actorUserId,
      metadata: {
        workOrderId: quote.workOrderId,
        respondedAt: quote.respondedAt?.toISOString() ?? null,
        ...(metadata ?? {}),
      },
    });

    return this.toEntity(quote);
  }

  async findByWorkOrderId(
    workshopId: string,
    workOrderId: string,
  ): Promise<QuoteEntity> {
    const workOrder = await this.workOrdersService.findByIdInWorkshop(
      workshopId,
      workOrderId,
    );

    if (workOrder.type !== 'diagnostic') {
      throw new ConflictException(
        'Quotes are only allowed for diagnostic work orders.',
      );
    }

    const quote = await this.quoteModel
      .findOne({
        workshopId,
        workOrderId,
      })
      .exec();

    if (!quote) {
      throw new NotFoundException('Quote not found for work order.');
    }

    return this.toEntity(quote);
  }

  async respondFromClientPortal(
    workshopId: string,
    quoteId: string,
    user: CurrentUserContext,
    input: CustomerQuoteResponseDto,
  ): Promise<QuoteEntity> {
    const quote = await this.findDocumentByIdInWorkshop(workshopId, quoteId);
    const workOrder = await this.workOrdersService.findByIdInWorkshop(
      workshopId,
      quote.workOrderId,
    );

    const customer = await this.customersService.resolvePortalCustomerInWorkshop(
      workshopId,
      user,
    );

    if (!customer || customer.id !== workOrder.clientId) {
      throw new NotFoundException('Quote not found for customer.');
    }

    const metadata = {
      source: 'client_portal',
      comment: this.normalizeOptionalComment(input.comment),
    };

    if (input.decision === 'approve') {
      return await this.approveQuote(workshopId, quoteId, user.id, metadata);
    }

    return await this.rejectQuote(workshopId, quoteId, user.id, metadata);
  }

  private async assertDiagnosticWorkOrderReadyForQuoteAction(
    workshopId: string,
    workOrderId: string,
    diagnosticId: string,
    allowedStatuses: string[],
  ): Promise<void> {
    const diagnostic = await this.diagnosticsService.findByIdInWorkshop(
      workshopId,
      diagnosticId,
    );

    if (diagnostic.workOrderId !== workOrderId) {
      throw new ConflictException('Quote diagnostic does not match work order.');
    }

    if (diagnostic.status !== 'completed') {
      throw new ConflictException(
        'Quote actions require a completed diagnostic.',
      );
    }

    const workOrder = await this.workOrdersService.findByIdInWorkshop(
      workshopId,
      workOrderId,
    );

    if (workOrder.type !== 'diagnostic') {
      throw new ConflictException(
        'Quotes are only allowed for diagnostic work orders.',
      );
    }

    if (!allowedStatuses.includes(workOrder.status)) {
      throw new ConflictException(
        `Quote action is not allowed while work order is ${workOrder.status}.`,
      );
    }
  }

  private async findDocumentByIdInWorkshop(
    workshopId: string,
    quoteId: string,
  ): Promise<QuoteDocument> {
    const quote = await this.quoteModel
      .findOne({
        _id: quoteId,
        workshopId,
      })
      .exec();

    if (!quote) {
      throw new NotFoundException('Quote not found in workshop.');
    }

    return quote;
  }

  private normalizeOptionalComment(comment?: string): string | null {
    const normalized = comment?.trim();
    return normalized ? normalized : null;
  }

  private toEntity(quote: QuoteDocument): QuoteEntity {
    return {
      id: quote._id.toString(),
      workshopId: quote.workshopId,
      workOrderId: quote.workOrderId,
      diagnosticId: quote.diagnosticId,
      status: quote.status,
      items: quote.items.map<QuoteItemEntity>((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      subtotal: quote.subtotal,
      total: quote.total,
      sentAt: quote.sentAt ? quote.sentAt.toISOString() : null,
      respondedAt: quote.respondedAt
        ? quote.respondedAt.toISOString()
        : null,
      createdByUserId: quote.createdByUserId,
      createdAt: quote.createdAt.toISOString(),
    };
  }
}
