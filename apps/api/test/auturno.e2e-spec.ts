import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import {
  AuditEvent,
  AuditEventDocument,
} from '../src/audit/schemas/audit-event.schema';
import { AuthGuard } from '../src/auth/auth.guard';
import { CurrentUserContext } from '../src/auth/types';
import {
  WorkOrder,
  WorkOrderDocument,
} from '../src/work-orders/schemas/work-order.schema';

jest.setTimeout(60000);

const E2E_DATABASE_NAME = createUniqueE2eDatabaseName();

type TestToken = 'tenant-a' | 'tenant-b';

const TEST_USERS: Record<TestToken, CurrentUserContext> = {
  'tenant-a': {
    id: 'user-tenant-a',
    authSubject: 'auth0|tenant-a',
    email: 'tenant-a@test.local',
    name: 'Tenant A',
    workshopId: 'workshop-a',
    roles: ['owner'],
    permissions: [
      'workshop.manage',
      'users.manage',
      'services.manage',
      'appointments.manage',
      'workorders.read',
      'workorders.write',
      'diagnostics.write',
      'quotes.write',
      'payments.write',
      'clients.read',
      'clients.write',
      'metrics.read',
    ],
  },
  'tenant-b': {
    id: 'user-tenant-b',
    authSubject: 'auth0|tenant-b',
    email: 'tenant-b@test.local',
    name: 'Tenant B',
    workshopId: 'workshop-b',
    roles: ['owner'],
    permissions: [
      'workshop.manage',
      'users.manage',
      'services.manage',
      'appointments.manage',
      'workorders.read',
      'workorders.write',
      'diagnostics.write',
      'quotes.write',
      'payments.write',
      'clients.read',
      'clients.write',
      'metrics.read',
    ],
  },
};

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: CurrentUserContext;
    }>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token.');
    }

    const token = authHeader.replace('Bearer ', '').trim() as TestToken;
    const user = TEST_USERS[token];

    if (!user) {
      throw new UnauthorizedException('Invalid test token.');
    }

    request.user = { ...user };
    return true;
  }
}

describe('AUTURNO API e2e', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let connection: Connection;
  let auditEventModel: Model<AuditEventDocument>;
  let workOrderModel: Model<WorkOrderDocument>;
  let customerSequence = 0;
  let vehicleSequence = 0;

  beforeAll(async () => {
    process.env.MONGODB_URI = resolveE2eMongoUri();

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue(new TestAuthGuard())
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    connection = moduleRef.get<Connection>(getConnectionToken());
    auditEventModel = moduleRef.get<Model<AuditEventDocument>>(
      getModelToken(AuditEvent.name),
    );
    workOrderModel = moduleRef.get<Model<WorkOrderDocument>>(
      getModelToken(WorkOrder.name),
    );
  });

  beforeEach(async () => {
    if (connection?.readyState === 1) {
      await connection.dropDatabase();
    }

    customerSequence = 0;
    vehicleSequence = 0;
  });

  afterAll(async () => {
    if (connection?.readyState === 1) {
      await connection.dropDatabase();
    }

    if (app) {
      await app.close();
    }
  });

  it('covers the direct service flow', async () => {
    const service = await createService('tenant-a', false, 'Oil Change');
    const appointment = await createAppointment('tenant-a', service.id);
    const workOrder = await createWorkOrder('tenant-a', appointment.id);

    expect(workOrder.type).toBe('direct');
    expect(workOrder.status).toBe('scheduled');
    await expectAuditEvent('workshop-a', 'work_order', workOrder.id, 'work_order_created');
  });

  it('creates and lists customers within a workshop and hides them from other tenants', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Maria Gomez',
      phone: '+54 11 5555 0001',
      email: 'maria@test.local',
    });

    expect(customer.name).toBe('Maria Gomez');
    expect(customer.workshopId).toBe('workshop-a');

    const tenantAListResponse = await request(app.getHttpServer())
      .get('/customers')
      .set('Authorization', 'Bearer tenant-a')
      .expect(200);

    expect(tenantAListResponse.body).toHaveLength(1);
    expect(tenantAListResponse.body[0]).toMatchObject({
      id: customer.id,
      workshopId: 'workshop-a',
      name: 'Maria Gomez',
    });

    const tenantBListResponse = await request(app.getHttpServer())
      .get('/customers')
      .set('Authorization', 'Bearer tenant-b')
      .expect(200);

    expect(tenantBListResponse.body).toEqual([]);
  });

  it('creates and lists vehicles by customer, rejects workshop plate duplicates, and hides them from other tenants', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Laura Driver',
    });

    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'ab 123 cd',
      brand: 'Ford',
      model: 'Fiesta',
      year: 2018,
    });

    expect(vehicle.customerId).toBe(customer.id);
    expect(vehicle.plate).toBe('AB 123 CD');

    const listResponse = await request(app.getHttpServer())
      .get('/vehicles')
      .query({ customerId: customer.id })
      .set('Authorization', 'Bearer tenant-a')
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0]).toMatchObject({
      id: vehicle.id,
      customerId: customer.id,
      workshopId: 'workshop-a',
    });

    await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', 'Bearer tenant-a')
      .send({
        customerId: customer.id,
        plate: 'AB-123-CD',
      })
      .expect(409);

    const otherTenantCustomer = await createCustomer('tenant-b', {
      name: 'Tenant B Driver',
    });

    await request(app.getHttpServer())
      .get('/vehicles')
      .query({ customerId: otherTenantCustomer.id })
      .set('Authorization', 'Bearer tenant-b')
      .expect(200, []);

    await request(app.getHttpServer())
      .get('/vehicles')
      .query({ customerId: customer.id })
      .set('Authorization', 'Bearer tenant-b')
      .expect(404);
  });

  it('enforces customer and vehicle consistency when creating appointments', async () => {
    const service = await createService('tenant-a', false, 'Alignment');
    const customer = await createCustomer('tenant-a', {
      name: 'Valid Customer',
    });
    const otherCustomer = await createCustomer('tenant-a', {
      name: 'Other Customer',
    });
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'TA-100',
    });

    await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', 'Bearer tenant-a')
      .send({
        clientId: createMissingObjectId(),
        vehicleId: vehicle.id,
        serviceId: service.id,
        scheduledStartAt: '2026-03-16T10:00:00.000Z',
      })
      .expect(404);

    await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', 'Bearer tenant-a')
      .send({
        clientId: customer.id,
        vehicleId: createMissingObjectId(),
        serviceId: service.id,
        scheduledStartAt: '2026-03-16T10:00:00.000Z',
      })
      .expect(404);

    await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', 'Bearer tenant-a')
      .send({
        clientId: otherCustomer.id,
        vehicleId: vehicle.id,
        serviceId: service.id,
        scheduledStartAt: '2026-03-16T10:00:00.000Z',
      })
      .expect(404);

    const validAppointmentResponse = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', 'Bearer tenant-a')
      .send({
        clientId: customer.id,
        vehicleId: vehicle.id,
        serviceId: service.id,
        scheduledStartAt: '2026-03-16T10:00:00.000Z',
      })
      .expect(201);

    expect(validAppointmentResponse.body).toMatchObject({
      workshopId: 'workshop-a',
      clientId: customer.id,
      vehicleId: vehicle.id,
      serviceId: service.id,
    });
  });

  it('covers the intake happy path with customer, vehicle, appointment, and work-order creation', async () => {
    const service = await createService('tenant-a', false, 'Battery Replacement');
    const customer = await createCustomer('tenant-a', {
      name: 'Happy Path Customer',
      phone: '+54 11 5555 0101',
    });
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'HP-101',
      brand: 'Toyota',
      model: 'Etios',
      year: 2019,
    });
    const appointment = await createAppointment('tenant-a', service.id, {
      customerId: customer.id,
      vehicleId: vehicle.id,
    });
    const workOrder = await createWorkOrder('tenant-a', appointment.id);

    expect(workOrder).toMatchObject({
      workshopId: 'workshop-a',
      appointmentId: appointment.id,
      type: 'direct',
      status: 'scheduled',
      clientId: customer.id,
      vehicleId: vehicle.id,
      serviceId: service.id,
    });
  });

  it('lists tenant appointments ordered by scheduled start and excludes other workshops', async () => {
    const service = await createService('tenant-a', false, 'Agenda Service');
    const laterAppointment = await createAppointment('tenant-a', service.id, {
      scheduledStartAt: '2026-03-16T12:00:00.000Z',
    });
    const earlierAppointment = await createAppointment('tenant-a', service.id, {
      scheduledStartAt: '2026-03-16T08:00:00.000Z',
    });

    await createAppointment('tenant-b', (await createService('tenant-b', false, 'Other Tenant Service')).id, {
      scheduledStartAt: '2026-03-16T09:00:00.000Z',
    });

    const response = await request(app.getHttpServer())
      .get('/appointments')
      .set('Authorization', 'Bearer tenant-a')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.map((appointment: { id: string }) => appointment.id)).toEqual([
      earlierAppointment.id,
      laterAppointment.id,
    ]);
    expect(
      response.body.every(
        (appointment: { workshopId: string }) =>
          appointment.workshopId === 'workshop-a',
      ),
    ).toBe(true);
  });

  it('covers direct work-order operational actions', async () => {
    const service = await createService('tenant-a', false, 'Tire Rotation');
    const appointment = await createAppointment('tenant-a', service.id);
    const workOrder = await createWorkOrder('tenant-a', appointment.id);

    const inOperation = await startOperation('tenant-a', workOrder.id);
    expect(inOperation.status).toBe('in_operation');

    const ready = await markReady('tenant-a', workOrder.id);
    expect(ready.status).toBe('ready');

    const closed = await closeWorkOrder('tenant-a', workOrder.id);
    expect(closed.status).toBe('closed');

    const pickedUp = await pickUpWorkOrder('tenant-a', workOrder.id);
    expect(pickedUp.status).toBe('picked_up');
  });

  it('covers the diagnostic flow without implying quote_sent on completion', async () => {
    const flow = await createCompletedDiagnosticFlow('tenant-a');
    const persistedWorkOrder = await findWorkOrder(flow.workOrder.id);

    expect(flow.workOrder.type).toBe('diagnostic');
    expect(flow.workOrder.status).toBe('reception');
    expect(flow.diagnosticDraft.status).toBe('draft');
    expect(flow.completedDiagnostic.status).toBe('completed');
    expect(persistedWorkOrder?.status).toBe('in_diagnosis');
    await expectAuditEvent(
      'workshop-a',
      'work_order',
      flow.workOrder.id,
      'work_order_status_changed',
    );
    await expectAuditEvent(
      'workshop-a',
      'diagnostic',
      flow.diagnosticDraft.id,
      'diagnostic_created',
    );
    await expectAuditEvent(
      'workshop-a',
      'diagnostic',
      flow.completedDiagnostic.id,
      'diagnostic_completed',
    );
  });

  it('covers quote send and approval flow', async () => {
    const flow = await createCompletedDiagnosticFlow('tenant-a');
    const quote = await createQuote('tenant-a', flow.completedDiagnostic.id);

    expect(quote.status).toBe('draft');

    const sentQuote = await sendQuote('tenant-a', quote.id);
    expect(sentQuote.status).toBe('sent');
    expect((await findWorkOrder(flow.workOrder.id))?.status).toBe('quote_sent');
    await expectAuditEvent('workshop-a', 'quote', quote.id, 'quote_created');
    await expectAuditEvent('workshop-a', 'quote', quote.id, 'quote_sent');

    const approvedQuote = await approveQuote('tenant-a', quote.id);
    expect(approvedQuote.status).toBe('approved');
    expect((await findWorkOrder(flow.workOrder.id))?.status).toBe(
      'in_operation',
    );
    await expectAuditEvent('workshop-a', 'quote', quote.id, 'quote_approved');
  });

  it('covers diagnostic approved work-order operational actions', async () => {
    const flow = await createCompletedDiagnosticFlow('tenant-a');
    const quote = await createQuote('tenant-a', flow.completedDiagnostic.id);

    await sendQuote('tenant-a', quote.id);
    await approveQuote('tenant-a', quote.id);
    expect((await findWorkOrder(flow.workOrder.id))?.status).toBe(
      'in_operation',
    );

    const ready = await markReady('tenant-a', flow.workOrder.id);
    expect(ready.status).toBe('ready');

    const closed = await closeWorkOrder('tenant-a', flow.workOrder.id);
    expect(closed.status).toBe('closed');

    const pickedUp = await pickUpWorkOrder('tenant-a', flow.workOrder.id);
    expect(pickedUp.status).toBe('picked_up');
  });

  it('covers quote rejection flow in a separate diagnostic path', async () => {
    const flow = await createCompletedDiagnosticFlow('tenant-a', 'Brake Noise');
    const quote = await createQuote('tenant-a', flow.completedDiagnostic.id);

    await sendQuote('tenant-a', quote.id);
    const rejectedQuote = await rejectQuote('tenant-a', quote.id);

    expect(rejectedQuote.status).toBe('rejected');
    expect((await findWorkOrder(flow.workOrder.id))?.status).toBe('closed');
    await expectAuditEvent('workshop-a', 'quote', quote.id, 'quote_rejected');
  });

  it('prevents creating diagnostics for direct work-orders', async () => {
    const service = await createService('tenant-a', false, 'Battery');
    const appointment = await createAppointment('tenant-a', service.id);
    const workOrder = await createWorkOrder('tenant-a', appointment.id);

    await request(app.getHttpServer())
      .post(`/diagnostics/work-order/${workOrder.id}`)
      .set('Authorization', 'Bearer tenant-a')
      .send(createDiagnosticPayload())
      .expect(409);
  });

  it('prevents creating quotes from draft diagnostics', async () => {
    const flow = await createDiagnosticDraftFlow('tenant-a');

    await request(app.getHttpServer())
      .post(`/quotes/from-diagnostic/${flow.diagnosticDraft.id}`)
      .set('Authorization', 'Bearer tenant-a')
      .send(createQuotePayload())
      .expect(409);
  });

  it('prevents cross-tenant access to tenant-owned resources', async () => {
    const flow = await createCompletedDiagnosticFlow('tenant-a');
    const quote = await createQuote('tenant-a', flow.completedDiagnostic.id);

    await request(app.getHttpServer())
      .get(`/diagnostics/work-order/${flow.workOrder.id}`)
      .set('Authorization', 'Bearer tenant-b')
      .expect(404);

    await request(app.getHttpServer())
      .get(`/quotes/work-order/${flow.workOrder.id}`)
      .set('Authorization', 'Bearer tenant-b')
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/quotes/${quote.id}/send`)
      .set('Authorization', 'Bearer tenant-b')
      .expect(404);
  });

  it('prevents invalid operational transitions', async () => {
    const diagnosticFlow = await createDiagnosticDraftFlow(
      'tenant-a',
      'Transmission Diagnosis',
    );

    await request(app.getHttpServer())
      .patch(`/work-orders/${diagnosticFlow.workOrder.id}/start-operation`)
      .set('Authorization', 'Bearer tenant-a')
      .expect(409);

    const directService = await createService('tenant-a', false, 'Quick Wash');
    const directAppointment = await createAppointment('tenant-a', directService.id);
    const directWorkOrder = await createWorkOrder('tenant-a', directAppointment.id);

    await request(app.getHttpServer())
      .patch(`/work-orders/${directWorkOrder.id}/pick-up`)
      .set('Authorization', 'Bearer tenant-a')
      .expect(409);

    const completedDiagnosticFlow = await createCompletedDiagnosticFlow(
      'tenant-a',
      'Cooling System Diagnosis',
    );
    const quote = await createQuote('tenant-a', completedDiagnosticFlow.completedDiagnostic.id);
    await sendQuote('tenant-a', quote.id);

    await request(app.getHttpServer())
      .patch(`/work-orders/${completedDiagnosticFlow.workOrder.id}/mark-ready`)
      .set('Authorization', 'Bearer tenant-a')
      .expect(409);
  });

  async function createService(
    token: TestToken,
    requiresDiagnostic: boolean,
    name: string,
  ): Promise<{ id: string; requiresDiagnostic: boolean }> {
    const response = await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name,
        estimatedDurationHours: requiresDiagnostic ? 1.5 : 1,
        requiresDiagnostic,
      })
      .expect(201);

    return response.body as { id: string; requiresDiagnostic: boolean };
  }

  async function createCustomer(
    token: TestToken,
    input?: {
      name?: string;
      phone?: string;
      email?: string;
    },
  ): Promise<{ id: string; workshopId: string; name: string }> {
    customerSequence += 1;

    const response = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: input?.name ?? `${token} Customer ${customerSequence}`,
        phone: input?.phone,
        email: input?.email,
      })
      .expect(201);

    return response.body as { id: string; workshopId: string; name: string };
  }

  async function createVehicle(
    token: TestToken,
    customerId: string,
    input?: {
      plate?: string;
      brand?: string;
      model?: string;
      year?: number;
    },
  ): Promise<{
    id: string;
    workshopId: string;
    customerId: string;
    plate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
  }> {
    vehicleSequence += 1;

    const platePrefix = token === 'tenant-a' ? 'TA' : 'TB';
    const response = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        plate: input?.plate ?? `${platePrefix}-${vehicleSequence}`,
        brand: input?.brand,
        model: input?.model,
        year: input?.year,
      })
      .expect(201);

    return response.body as {
      id: string;
      workshopId: string;
      customerId: string;
      plate: string;
      brand: string | null;
      model: string | null;
      year: number | null;
    };
  }

  async function createAppointment(
    token: TestToken,
    serviceId: string,
    input?: {
      customerId?: string;
      vehicleId?: string;
      scheduledStartAt?: string;
    },
  ): Promise<{ id: string }> {
    const customerId = input?.customerId ?? (await createCustomer(token)).id;
    const vehicleId =
      input?.vehicleId ?? (await createVehicle(token, customerId)).id;

    const response = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: customerId,
        vehicleId,
        serviceId,
        scheduledStartAt:
          input?.scheduledStartAt ?? '2026-03-16T10:00:00.000Z',
      })
      .expect(201);

    return response.body as { id: string };
  }

  async function createWorkOrder(
    token: TestToken,
    appointmentId: string,
  ): Promise<{
    id: string;
    workshopId: string;
    appointmentId: string;
    type: string;
    status: string;
    clientId: string;
    vehicleId: string;
    serviceId: string;
  }> {
    const response = await request(app.getHttpServer())
      .post(`/work-orders/from-appointment/${appointmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    return response.body as {
      id: string;
      workshopId: string;
      appointmentId: string;
      type: string;
      status: string;
      clientId: string;
      vehicleId: string;
      serviceId: string;
    };
  }

  async function createDiagnosticDraft(
    token: TestToken,
    workOrderId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .post(`/diagnostics/work-order/${workOrderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(createDiagnosticPayload())
      .expect(201);

    return response.body as { id: string; status: string };
  }

  async function completeDiagnostic(
    token: TestToken,
    diagnosticId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .patch(`/diagnostics/${diagnosticId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as { id: string; status: string };
  }

  async function createQuote(
    token: TestToken,
    diagnosticId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .post(`/quotes/from-diagnostic/${diagnosticId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(createQuotePayload())
      .expect(201);

    return response.body as { id: string; status: string };
  }

  async function sendQuote(
    token: TestToken,
    quoteId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/send`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as { id: string; status: string };
  }

  async function approveQuote(
    token: TestToken,
    quoteId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as { id: string; status: string };
  }

  async function rejectQuote(
    token: TestToken,
    quoteId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as { id: string; status: string };
  }

  async function startOperation(
    token: TestToken,
    workOrderId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .patch(`/work-orders/${workOrderId}/start-operation`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as { id: string; status: string };
  }

  async function markReady(
    token: TestToken,
    workOrderId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .patch(`/work-orders/${workOrderId}/mark-ready`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as { id: string; status: string };
  }

  async function closeWorkOrder(
    token: TestToken,
    workOrderId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .patch(`/work-orders/${workOrderId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as { id: string; status: string };
  }

  async function pickUpWorkOrder(
    token: TestToken,
    workOrderId: string,
  ): Promise<{ id: string; status: string }> {
    const response = await request(app.getHttpServer())
      .patch(`/work-orders/${workOrderId}/pick-up`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as { id: string; status: string };
  }

  async function createDiagnosticDraftFlow(
    token: TestToken,
    serviceName = 'Electrical Diagnosis',
  ) {
    const service = await createService(token, true, serviceName);
    const appointment = await createAppointment(token, service.id);
    const workOrder = await createWorkOrder(token, appointment.id);
    const diagnosticDraft = await createDiagnosticDraft(token, workOrder.id);

    return {
      service,
      appointment,
      workOrder,
      diagnosticDraft,
    };
  }

  async function createCompletedDiagnosticFlow(
    token: TestToken,
    serviceName = 'Engine Diagnosis',
  ) {
    const flow = await createDiagnosticDraftFlow(token, serviceName);
    const completedDiagnostic = await completeDiagnostic(
      token,
      flow.diagnosticDraft.id,
    );

    return {
      ...flow,
      completedDiagnostic,
    };
  }

  async function findWorkOrder(id: string) {
    return await workOrderModel.findById(id).lean();
  }

  async function expectAuditEvent(
    workshopId: string,
    entityType: 'work_order' | 'diagnostic' | 'quote',
    entityId: string,
    action:
      | 'work_order_created'
      | 'work_order_status_changed'
      | 'diagnostic_created'
      | 'diagnostic_completed'
      | 'quote_created'
      | 'quote_sent'
      | 'quote_approved'
      | 'quote_rejected',
  ) {
    const auditEvent = await auditEventModel
      .findOne({
        workshopId,
        entityType,
        entityId,
        action,
      })
      .lean();

    expect(auditEvent).toBeTruthy();
    expect(auditEvent?.actorUserId).toBe('user-tenant-a');
  }

  function createDiagnosticPayload() {
    return {
      summary: 'Initial diagnosis completed',
      notes: 'Vehicle inspected on arrival',
      estimatedOperationHours: 2.5,
      recommendedServices: ['Brake pads', 'Rotor inspection'],
    };
  }

  function createQuotePayload() {
    return {
      items: [
        {
          description: 'Brake pads replacement',
          quantity: 1,
          unitPrice: 120,
        },
        {
          description: 'Labor',
          quantity: 2,
          unitPrice: 45,
        },
      ],
    };
  }

  function createMissingObjectId(): string {
    return new Types.ObjectId().toString();
  }
});

function resolveE2eMongoUri(): string {
  const explicitUri = process.env.E2E_MONGODB_URI?.trim();

  if (explicitUri) {
    const url = new URL(explicitUri);
    url.pathname = `/${E2E_DATABASE_NAME}`;
    return url.toString();
  }

  const baseUri = process.env.MONGODB_URI?.trim();

  if (!baseUri) {
    throw new Error(
      'Set E2E_MONGODB_URI or MONGODB_URI before running the e2e suite.',
    );
  }

  const url = new URL(baseUri);
  url.pathname = `/${E2E_DATABASE_NAME}`;
  return url.toString();
}

function createUniqueE2eDatabaseName(): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `auturno_api_e2e_${timestamp}_${randomSuffix}`;
}
