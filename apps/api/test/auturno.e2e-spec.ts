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
import {
  Notification,
  NotificationDocument,
} from '../src/notifications/schemas/notification.schema';
import { CurrentUserContext } from '../src/auth/types';
import {
  WorkOrder,
  WorkOrderDocument,
} from '../src/work-orders/schemas/work-order.schema';

jest.setTimeout(60000);

const E2E_DATABASE_NAME = createUniqueE2eDatabaseName();

type TestToken =
  | 'tenant-a'
  | 'tenant-b'
  | 'client-a'
  | 'client-b'
  | 'client-a-alt-email'
  | 'client-other-tenant';

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
  'client-a': {
    id: 'user-client-a',
    authSubject: 'auth0|client-a',
    email: 'client-a@test.local',
    name: 'Client A',
    workshopId: 'workshop-a',
    roles: ['client'],
    permissions: [],
  },
  'client-b': {
    id: 'user-client-b',
    authSubject: 'auth0|client-b',
    email: 'client-b@test.local',
    name: 'Client B',
    workshopId: 'workshop-a',
    roles: ['client'],
    permissions: [],
  },
  'client-a-alt-email': {
    id: 'user-client-a',
    authSubject: 'auth0|client-a',
    email: 'client-a-updated@test.local',
    name: 'Client A',
    workshopId: 'workshop-a',
    roles: ['client'],
    permissions: [],
  },
  'client-other-tenant': {
    id: 'user-client-other-tenant',
    authSubject: 'auth0|client-other-tenant',
    email: 'client-a@test.local',
    name: 'Client Other Tenant',
    workshopId: 'workshop-b',
    roles: ['client'],
    permissions: [],
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
  let notificationModel: Model<NotificationDocument>;
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
    notificationModel = moduleRef.get<Model<NotificationDocument>>(
      getModelToken(Notification.name),
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

  it('updates a service in the same workshop and preserves duplicate protection', async () => {
    const service = await createService('tenant-a', false, 'Oil Change');
    await createService('tenant-a', true, 'Brake Diagnosis');

    const updateResponse = await request(app.getHttpServer())
      .patch(`/services/${service.id}`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        name: 'Express Oil Change',
        estimatedDurationHours: 1.5,
        requiresDiagnostic: false,
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: service.id,
      workshopId: 'workshop-a',
      name: 'Express Oil Change',
      estimatedDurationHours: 1.5,
      requiresDiagnostic: false,
    });

    await request(app.getHttpServer())
      .patch(`/services/${service.id}`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        name: '  brake   diagnosis ',
        estimatedDurationHours: 2,
        requiresDiagnostic: true,
      })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/services/${service.id}`)
      .set('Authorization', 'Bearer tenant-b')
      .send({
        name: 'Cross Tenant Update',
        estimatedDurationHours: 2,
        requiresDiagnostic: false,
      })
      .expect(404);
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

  it('updates customers in the same workshop and rejects cross-tenant updates', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Maria Gomez',
      phone: '+54 11 5555 0001',
      email: 'maria@test.local',
    });

    const updateResponse = await request(app.getHttpServer())
      .patch(`/customers/${customer.id}`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        name: 'Maria Elena Gomez',
        phone: '+54 11 5555 1111',
        email: 'maria.elena@test.local',
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: customer.id,
      workshopId: 'workshop-a',
      name: 'Maria Elena Gomez',
      phone: '+54 11 5555 1111',
      email: 'maria.elena@test.local',
    });

    await request(app.getHttpServer())
      .patch(`/customers/${customer.id}`)
      .set('Authorization', 'Bearer tenant-b')
      .send({
        name: 'Cross Tenant Customer',
      })
      .expect(404);
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

  it('updates vehicles in the same workshop, preserves duplicate plate protection, and rejects cross-tenant updates', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Laura Driver',
    });
    const firstVehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'ab 123 cd',
      brand: 'Ford',
      model: 'Fiesta',
      year: 2018,
    });
    await createVehicle('tenant-a', customer.id, {
      plate: 'zz 999 yy',
      brand: 'Peugeot',
      model: '208',
      year: 2020,
    });

    const updateResponse = await request(app.getHttpServer())
      .patch(`/vehicles/${firstVehicle.id}`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        plate: 'AC 456 EF',
        brand: 'Ford',
        model: 'Focus',
        year: 2021,
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: firstVehicle.id,
      workshopId: 'workshop-a',
      customerId: customer.id,
      plate: 'AC 456 EF',
      brand: 'Ford',
      model: 'Focus',
      year: 2021,
    });

    await request(app.getHttpServer())
      .patch(`/vehicles/${firstVehicle.id}`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        plate: 'ZZ-999-YY',
        brand: 'Ford',
        model: 'Focus',
        year: 2021,
      })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/vehicles/${firstVehicle.id}`)
      .set('Authorization', 'Bearer tenant-b')
      .send({
        plate: 'TB-123',
      })
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

  it('updates direct work-order delivery promises and creates an audit event', async () => {
    const service = await createService('tenant-a', false, 'Oil Change');
    const appointment = await createAppointment('tenant-a', service.id);
    const workOrder = await createWorkOrder('tenant-a', appointment.id);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/work-orders/${workOrder.id}/promises`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        promisedDeliveryAt: '2026-03-16T14:30:00.000Z',
        reason: 'Parts delayed by supplier',
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: workOrder.id,
      workshopId: 'workshop-a',
      promisedDeliveryAt: '2026-03-16T14:30:00.000Z',
    });

    const auditEvent = await auditEventModel
      .findOne({
        workshopId: 'workshop-a',
        entityType: 'work_order',
        entityId: workOrder.id,
        action: 'work_order_promises_changed',
      })
      .lean();

    expect(auditEvent).toBeTruthy();
    expect(auditEvent?.actorUserId).toBe('user-tenant-a');
    expect(auditEvent?.metadata).toMatchObject({
      toPromisedDeliveryAt: '2026-03-16T14:30:00.000Z',
      reason: 'Parts delayed by supplier',
    });

    const notification = await findNotificationByEvent(
      'workshop-a',
      workOrder.id,
      'work_order_promises_changed',
    );

    expect(notification).toBeTruthy();
    expect(notification?.status).toBe('pending');
  });

  it('updates diagnostic promises before operation and rejects cross-tenant promise updates', async () => {
    const flow = await createDiagnosticDraftFlow('tenant-a');

    const updateResponse = await request(app.getHttpServer())
      .patch(`/work-orders/${flow.workOrder.id}/promises`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        promisedDiagnosticAt: '2026-03-16T12:00:00.000Z',
        reason: 'Need more inspection time',
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: flow.workOrder.id,
      workshopId: 'workshop-a',
      promisedDiagnosticAt: '2026-03-16T12:00:00.000Z',
    });

    await request(app.getHttpServer())
      .patch(`/work-orders/${flow.workOrder.id}/promises`)
      .set('Authorization', 'Bearer tenant-b')
      .send({
        promisedDiagnosticAt: '2026-03-16T13:00:00.000Z',
      })
      .expect(404);
  });

  it('lists same-tenant work-order history with promise and status events and rejects cross-tenant access', async () => {
    const service = await createService('tenant-a', false, 'Alignment');
    const appointment = await createAppointment('tenant-a', service.id);
    const workOrder = await createWorkOrder('tenant-a', appointment.id);

    await request(app.getHttpServer())
      .patch(`/work-orders/${workOrder.id}/promises`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        promisedDeliveryAt: '2026-03-16T15:00:00.000Z',
        reason: 'Workshop load adjusted',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/work-orders/${workOrder.id}/start-operation`)
      .set('Authorization', 'Bearer tenant-a')
      .expect(200);

    const historyResponse = await request(app.getHttpServer())
      .get(`/work-orders/${workOrder.id}/history`)
      .set('Authorization', 'Bearer tenant-a')
      .expect(200);

    expect(historyResponse.body).toHaveLength(3);
    expect(historyResponse.body.map((event: { action: string }) => event.action)).toEqual([
      'work_order_created',
      'work_order_promises_changed',
      'work_order_status_changed',
    ]);
    expect(historyResponse.body[1]).toMatchObject({
      entityType: 'work_order',
      actorUserId: 'user-tenant-a',
      metadata: {
        reason: 'Workshop load adjusted',
        toPromisedDeliveryAt: '2026-03-16T15:00:00.000Z',
      },
    });
    expect(historyResponse.body[2]).toMatchObject({
      entityType: 'work_order',
      actorUserId: 'user-tenant-a',
      metadata: {
        fromStatus: 'scheduled',
        toStatus: 'in_operation',
      },
    });

    await request(app.getHttpServer())
      .get(`/work-orders/${workOrder.id}/history`)
      .set('Authorization', 'Bearer tenant-b')
      .expect(404);
  });

  it('creates notifications for key work-order events, lists them in the same tenant, and rejects cross-tenant access', async () => {
    const flow = await createCompletedDiagnosticFlow('tenant-a', 'Brake Diagnosis');
    const quote = await createQuote('tenant-a', flow.completedDiagnostic.id);

    await sendQuote('tenant-a', quote.id);

    await request(app.getHttpServer())
      .patch(`/work-orders/${flow.workOrder.id}/promises`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        promisedDiagnosticAt: '2026-03-16T17:00:00.000Z',
        reason: 'Need more test time',
      })
      .expect(200);

    await approveQuote('tenant-a', quote.id);
    await markReady('tenant-a', flow.workOrder.id);

    const notificationsResponse = await request(app.getHttpServer())
      .get(`/work-orders/${flow.workOrder.id}/notifications`)
      .set('Authorization', 'Bearer tenant-a')
      .expect(200);

    expect(notificationsResponse.body).toHaveLength(4);
    expect(
      notificationsResponse.body.map(
        (notification: { eventType: string }) => notification.eventType,
      ),
    ).toEqual([
      'work_order_status_changed',
      'work_order_status_changed',
      'work_order_promises_changed',
      'quote_sent',
    ]);
    expect(notificationsResponse.body[0]).toMatchObject({
      workshopId: 'workshop-a',
      workOrderId: flow.workOrder.id,
      status: 'pending',
    });

    await request(app.getHttpServer())
      .get(`/work-orders/${flow.workOrder.id}/notifications`)
      .set('Authorization', 'Bearer tenant-b')
      .expect(404);
  });

  it('acknowledges a work-order notification within the same tenant', async () => {
    const flow = await createCompletedDiagnosticFlow('tenant-a', 'Cooling Diagnosis');
    const quote = await createQuote('tenant-a', flow.completedDiagnostic.id);
    await sendQuote('tenant-a', quote.id);

    const notification = await findNotificationByEvent(
      'workshop-a',
      flow.workOrder.id,
      'quote_sent',
    );

    expect(notification).toBeTruthy();

    const acknowledgeResponse = await request(app.getHttpServer())
      .patch(
        `/work-orders/${flow.workOrder.id}/notifications/${notification?._id.toString()}/acknowledge`,
      )
      .set('Authorization', 'Bearer tenant-a')
      .expect(200);

    expect(acknowledgeResponse.body).toMatchObject({
      id: notification?._id.toString(),
      status: 'acknowledged',
      acknowledgedByUserId: 'user-tenant-a',
    });
    expect(acknowledgeResponse.body.acknowledgedAt).toBeTruthy();

    await request(app.getHttpServer())
      .patch(
        `/work-orders/${flow.workOrder.id}/notifications/${notification?._id.toString()}/acknowledge`,
      )
      .set('Authorization', 'Bearer tenant-b')
      .expect(404);
  });

  it('creates a customer invite and lets the intended client claim it', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      phone: '+54 11 5555 0100',
      email: 'client-a@test.local',
    });

    const inviteResponse = await request(app.getHttpServer())
      .post(`/customers/${customer.id}/invite`)
      .set('Authorization', 'Bearer tenant-a')
      .expect(201);

    expect(inviteResponse.body).toMatchObject({
      id: customer.id,
      inviteStatus: 'invited',
      email: 'client-a@test.local',
    });

    const meResponse = await request(app.getHttpServer())
      .get('/client/me')
      .set('Authorization', 'Bearer client-a')
      .expect(200);

    expect(meResponse.body).toEqual({
      status: 'invited',
      canClaim: true,
      customer: {
        id: customer.id,
        name: 'Client A',
        phone: '+54 11 5555 0100',
        email: 'client-a@test.local',
      },
      invitedAt: expect.any(String),
      claimedAt: null,
    });

    const claimResponse = await request(app.getHttpServer())
      .post('/client/claim')
      .set('Authorization', 'Bearer client-a')
      .expect(201);

    expect(claimResponse.body).toEqual({
      status: 'claimed',
      canClaim: false,
      customer: {
        id: customer.id,
        name: 'Client A',
        phone: '+54 11 5555 0100',
        email: 'client-a@test.local',
      },
      invitedAt: expect.any(String),
      claimedAt: expect.any(String),
    });

    const updateResponse = await request(app.getHttpServer())
      .patch('/client/me')
      .set('Authorization', 'Bearer client-a')
      .send({
        name: 'Client A Updated',
        phone: '+54 11 5555 0101',
        email: 'client-a-updated@test.local',
      })
      .expect(200);

    expect(updateResponse.body).toEqual({
      id: customer.id,
      name: 'Client A Updated',
      phone: '+54 11 5555 0101',
      email: 'client-a-updated@test.local',
    });

    const persistedCustomer = await findCustomer(customer.id);
    expect(persistedCustomer?.authSubject).toBe('auth0|client-a');
    expect(persistedCustomer?.inviteStatus).toBe('claimed');

    await request(app.getHttpServer())
      .get('/client/me')
      .set('Authorization', 'Bearer client-other-tenant')
      .expect(200, {
        status: 'not_invited',
        canClaim: false,
        customer: null,
        invitedAt: null,
        claimedAt: null,
      });
  });

  it('rejects claiming an invite from the wrong customer account', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });

    await inviteCustomer('tenant-a', customer.id);

    await request(app.getHttpServer())
      .post('/client/claim')
      .set('Authorization', 'Bearer client-b')
      .expect(404);
  });

  it('creates and updates only client-owned vehicles through /client/vehicles', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const otherCustomer = await createCustomer('tenant-a', {
      name: 'Client B',
      email: 'client-b@test.local',
    });
    const otherVehicle = await createVehicle('tenant-a', otherCustomer.id, {
      plate: 'OT-101',
      brand: 'Ford',
      model: 'Ka',
      year: 2017,
    });

    const createResponse = await request(app.getHttpServer())
      .post('/client/vehicles')
      .set('Authorization', 'Bearer client-a')
      .send({
        plate: 'ca 123 cd',
        brand: 'Toyota',
        model: 'Etios',
        year: 2020,
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      plate: 'CA 123 CD',
      brand: 'Toyota',
      model: 'Etios',
      year: 2020,
    });
    expect(createResponse.body.customerId).toBeUndefined();
    expect(createResponse.body.workshopId).toBeUndefined();

    const listResponse = await request(app.getHttpServer())
      .get('/client/vehicles')
      .set('Authorization', 'Bearer client-a')
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0]).toMatchObject({
      id: createResponse.body.id,
      plate: 'CA 123 CD',
    });

    const updateResponse = await request(app.getHttpServer())
      .patch(`/client/vehicles/${createResponse.body.id}`)
      .set('Authorization', 'Bearer client-a')
      .send({
        plate: 'ca 999 zz',
        brand: 'Toyota',
        model: 'Yaris',
        year: 2021,
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: createResponse.body.id,
      plate: 'CA 999 ZZ',
      brand: 'Toyota',
      model: 'Yaris',
      year: 2021,
    });

    await request(app.getHttpServer())
      .patch(`/client/vehicles/${otherVehicle.id}`)
      .set('Authorization', 'Bearer client-a')
      .send({
        plate: 'OT-202',
        brand: 'Ford',
        model: 'Ka',
        year: 2018,
      })
      .expect(404);

    const persistedCustomer = await findCustomer(customer.id);
    expect(persistedCustomer?.authSubject).toBe('auth0|client-a');
  });

  it('creates client service requests and lists only the linked customer requests', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const otherCustomer = await createCustomer('tenant-a', {
      name: 'Client B',
      email: 'client-b@test.local',
    });
    const service = await createService('tenant-a', false, 'Oil Change');
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'SR-101',
    });
    await createVehicle('tenant-a', otherCustomer.id, {
      plate: 'SR-202',
    });
    await inviteCustomer('tenant-a', customer.id);

    await request(app.getHttpServer())
      .post('/client/claim')
      .set('Authorization', 'Bearer client-a')
      .expect(201);

    await request(app.getHttpServer())
      .post('/client/service-requests')
      .set('Authorization', 'Bearer client-a')
      .send({
        vehicleId: vehicle.id,
        serviceId: service.id,
        preferredDateTime: '2026-03-18T10:00:00.000Z',
        comment: 'Need this before Friday.',
      })
      .expect(201);

    const clientListResponse = await request(app.getHttpServer())
      .get('/client/service-requests')
      .set('Authorization', 'Bearer client-a')
      .expect(200);

    expect(clientListResponse.body).toHaveLength(1);
    expect(clientListResponse.body[0]).toMatchObject({
      workshopId: 'workshop-a',
      customerId: customer.id,
      vehicleId: vehicle.id,
      serviceId: service.id,
      status: 'pending',
      comment: 'Need this before Friday.',
    });

    const workshopListResponse = await request(app.getHttpServer())
      .get('/service-requests')
      .set('Authorization', 'Bearer tenant-a')
      .expect(200);

    expect(workshopListResponse.body).toHaveLength(1);
    expect(workshopListResponse.body[0]).toMatchObject({
      customerId: customer.id,
      workshopId: 'workshop-a',
      status: 'pending',
    });

    await request(app.getHttpServer())
      .get('/service-requests')
      .set('Authorization', 'Bearer tenant-b')
      .expect(200, []);
  });

  it('rejects client service requests when the vehicle does not belong to the claimed customer', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const otherCustomer = await createCustomer('tenant-a', {
      name: 'Client B',
      email: 'client-b@test.local',
    });
    const service = await createService('tenant-a', false, 'Tire Rotation');
    const otherVehicle = await createVehicle('tenant-a', otherCustomer.id, {
      plate: 'SR-303',
    });
    await inviteCustomer('tenant-a', customer.id);

    await request(app.getHttpServer())
      .post('/client/claim')
      .set('Authorization', 'Bearer client-a')
      .expect(201);

    await request(app.getHttpServer())
      .post('/client/service-requests')
      .set('Authorization', 'Bearer client-a')
      .send({
        vehicleId: otherVehicle.id,
        serviceId: service.id,
        preferredDateTime: '2026-03-18T12:00:00.000Z',
      })
      .expect(404);
  });

  it('converts accepted service requests into appointments and rejects cross-tenant conversion', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const service = await createService('tenant-a', false, 'Battery Service');
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'SR-404',
    });
    await inviteCustomer('tenant-a', customer.id);

    await request(app.getHttpServer())
      .post('/client/claim')
      .set('Authorization', 'Bearer client-a')
      .expect(201);

    const createResponse = await request(app.getHttpServer())
      .post('/client/service-requests')
      .set('Authorization', 'Bearer client-a')
      .send({
        vehicleId: vehicle.id,
        serviceId: service.id,
        preferredDateTime: '2026-03-19T09:30:00.000Z',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/service-requests/${createResponse.body.id}/status`)
      .set('Authorization', 'Bearer tenant-a')
      .send({ status: 'accepted' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/service-requests/${createResponse.body.id}/convert-to-appointment`)
      .set('Authorization', 'Bearer tenant-b')
      .send({})
      .expect(404);

    const conversionResponse = await request(app.getHttpServer())
      .post(`/service-requests/${createResponse.body.id}/convert-to-appointment`)
      .set('Authorization', 'Bearer tenant-a')
      .send({})
      .expect(201);

    expect(conversionResponse.body.serviceRequest).toMatchObject({
      id: createResponse.body.id,
      status: 'converted',
      appointmentId: expect.any(String),
    });

    const appointmentsResponse = await request(app.getHttpServer())
      .get('/appointments')
      .set('Authorization', 'Bearer tenant-a')
      .expect(200);

    expect(
      appointmentsResponse.body.some(
        (appointment: {
          id: string;
          clientId: string;
          vehicleId: string;
          serviceId: string;
        }) =>
          appointment.id === conversionResponse.body.appointmentId &&
          appointment.clientId === customer.id &&
          appointment.vehicleId === vehicle.id &&
          appointment.serviceId === service.id,
      ),
    ).toBe(true);
  });

  it('lists only the linked customer work orders through /client/work-orders and preserves tenant isolation', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const otherCustomer = await createCustomer('tenant-a', {
      name: 'Client B',
      email: 'client-b@test.local',
    });

    const directService = await createService('tenant-a', false, 'Oil Change');
    const directVehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'CL-101',
      brand: 'Fiat',
      model: 'Cronos',
      year: 2022,
    });
    const directAppointment = await createAppointment('tenant-a', directService.id, {
      customerId: customer.id,
      vehicleId: directVehicle.id,
    });
    const directWorkOrder = await createWorkOrder('tenant-a', directAppointment.id);

    const diagnosticService = await createService('tenant-a', true, 'Brake Diagnosis');
    const diagnosticVehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'CL-202',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
    });
    const diagnosticAppointment = await createAppointment(
      'tenant-a',
      diagnosticService.id,
      {
        customerId: customer.id,
        vehicleId: diagnosticVehicle.id,
      },
    );
    const diagnosticWorkOrder = await createWorkOrder(
      'tenant-a',
      diagnosticAppointment.id,
    );
    const diagnosticDraft = await createDiagnosticDraft(
      'tenant-a',
      diagnosticWorkOrder.id,
    );
    const completedDiagnostic = await completeDiagnostic(
      'tenant-a',
      diagnosticDraft.id,
    );
    const quote = await createQuote('tenant-a', completedDiagnostic.id);
    await sendQuote('tenant-a', quote.id);

    const otherVehicle = await createVehicle('tenant-a', otherCustomer.id, {
      plate: 'OB-404',
    });
    const otherAppointment = await createAppointment('tenant-a', directService.id, {
      customerId: otherCustomer.id,
      vehicleId: otherVehicle.id,
    });
    await createWorkOrder('tenant-a', otherAppointment.id);

    const otherTenantCustomer = await createCustomer('tenant-b', {
      name: 'Client A in workshop B',
      email: 'client-a@test.local',
    });
    const otherTenantVehicle = await createVehicle('tenant-b', otherTenantCustomer.id, {
      plate: 'TB-202',
    });
    const otherTenantService = await createService('tenant-b', false, 'Alignment');
    const otherTenantAppointment = await createAppointment(
      'tenant-b',
      otherTenantService.id,
      {
        customerId: otherTenantCustomer.id,
        vehicleId: otherTenantVehicle.id,
      },
    );
    await createWorkOrder('tenant-b', otherTenantAppointment.id);

    const response = await request(app.getHttpServer())
      .get('/client/work-orders')
      .set('Authorization', 'Bearer client-a')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(
      response.body.map((workOrder: { workOrderId: string }) => workOrder.workOrderId),
    ).toEqual([diagnosticWorkOrder.id, directWorkOrder.id]);
    expect(response.body[0]).toMatchObject({
      workOrderId: diagnosticWorkOrder.id,
      currentStatus: 'quote_sent',
      customerFacingStatusLabel: 'Estimate ready for review',
      vehicleLabel: 'CL-202 - Toyota Corolla 2020',
      serviceName: 'Brake Diagnosis',
      quoteStatus: 'sent',
    });
    expect(response.body[1]).toMatchObject({
      workOrderId: directWorkOrder.id,
      currentStatus: 'scheduled',
      customerFacingStatusLabel: 'Scheduled with the workshop',
      vehicleLabel: 'CL-101 - Fiat Cronos 2022',
      serviceName: 'Oil Change',
      quoteStatus: null,
    });
    expect(response.body[0].clientId).toBeUndefined();
    expect(response.body[0].workshopId).toBeUndefined();

    const otherTenantResponse = await request(app.getHttpServer())
      .get('/client/work-orders')
      .set('Authorization', 'Bearer client-other-tenant')
      .expect(200);

    expect(otherTenantResponse.body).toHaveLength(1);
    expect(otherTenantResponse.body[0]).toMatchObject({
      serviceName: 'Alignment',
      currentStatus: 'scheduled',
    });
    expect(
      otherTenantResponse.body.some(
        (workOrder: { workOrderId: string }) =>
          workOrder.workOrderId === directWorkOrder.id ||
          workOrder.workOrderId === diagnosticWorkOrder.id,
      ),
    ).toBe(false);
  });

  it('returns a safe customer-facing tracking projection for the linked client and rejects invalid access', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const service = await createService('tenant-a', true, 'Brake Diagnosis');
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'CA-101',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
    });
    const appointment = await createAppointment('tenant-a', service.id, {
      customerId: customer.id,
      vehicleId: vehicle.id,
    });
    const workOrder = await createWorkOrder('tenant-a', appointment.id);

    await request(app.getHttpServer())
      .patch(`/work-orders/${workOrder.id}/promises`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        promisedDiagnosticAt: '2026-03-16T13:00:00.000Z',
        reason: 'Initial inspection queue updated',
      })
      .expect(200);

    const trackingResponse = await request(app.getHttpServer())
      .get(`/work-orders/${workOrder.id}/tracking`)
      .set('Authorization', 'Bearer client-a')
      .expect(200);

    expect(trackingResponse.body).toEqual({
      workOrderId: workOrder.id,
      quoteId: null,
      type: 'diagnostic',
      currentStatus: 'reception',
      customerFacingStatusLabel: 'Vehicle received',
      vehicleLabel: 'CA-101 - Toyota Corolla 2020',
      serviceName: 'Brake Diagnosis',
      promisedDiagnosticAt: '2026-03-16T13:00:00.000Z',
      promisedDeliveryAt: null,
      quoteStatus: null,
      lastUpdatedAt: expect.any(String),
    });
    expect(trackingResponse.body.clientId).toBeUndefined();
    expect(trackingResponse.body.workshopId).toBeUndefined();
    expect(trackingResponse.body.metadata).toBeUndefined();

    const persistedCustomer = await findCustomer(customer.id);
    expect(persistedCustomer?.authSubject).toBe('auth0|client-a');

    await request(app.getHttpServer())
      .get(`/work-orders/${workOrder.id}/tracking`)
      .set('Authorization', 'Bearer tenant-b')
      .expect(404);

    await request(app.getHttpServer())
      .get(`/work-orders/${workOrder.id}/tracking`)
      .set('Authorization', 'Bearer client-b')
      .expect(404);

    await request(app.getHttpServer())
      .get(`/work-orders/${workOrder.id}/tracking`)
      .set('Authorization', 'Bearer client-other-tenant')
      .expect(404);

    await request(app.getHttpServer())
      .get(`/work-orders/${workOrder.id}/tracking`)
      .expect(401);
  });

  it('keeps client tracking access working through the explicit auth-subject link even if the customer email changes', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const service = await createService('tenant-a', false, 'Oil Change');
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'TR-101',
    });
    const appointment = await createAppointment('tenant-a', service.id, {
      customerId: customer.id,
      vehicleId: vehicle.id,
    });
    const workOrder = await createWorkOrder('tenant-a', appointment.id);

    await inviteCustomer('tenant-a', customer.id);

    await request(app.getHttpServer())
      .post('/client/claim')
      .set('Authorization', 'Bearer client-a')
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/customers/${customer.id}`)
      .set('Authorization', 'Bearer tenant-a')
      .send({
        name: 'Client A',
        email: 'client-a-updated@test.local',
      })
      .expect(200);

    const trackingResponse = await request(app.getHttpServer())
      .get(`/work-orders/${workOrder.id}/tracking`)
      .set('Authorization', 'Bearer client-a-alt-email')
      .expect(200);

    expect(trackingResponse.body).toMatchObject({
      workOrderId: workOrder.id,
      currentStatus: 'scheduled',
      serviceName: 'Oil Change',
    });
    expect(trackingResponse.body.clientId).toBeUndefined();
    expect(trackingResponse.body.workshopId).toBeUndefined();
  });

  it('allows the linked customer to approve a sent quote and records client portal audit metadata', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const service = await createService('tenant-a', true, 'Engine Diagnosis');
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'QA-101',
    });
    const appointment = await createAppointment('tenant-a', service.id, {
      customerId: customer.id,
      vehicleId: vehicle.id,
    });
    const workOrder = await createWorkOrder('tenant-a', appointment.id);
    const diagnosticDraft = await createDiagnosticDraft('tenant-a', workOrder.id);
    const completedDiagnostic = await completeDiagnostic('tenant-a', diagnosticDraft.id);
    const quote = await createQuote('tenant-a', completedDiagnostic.id);
    await sendQuote('tenant-a', quote.id);
    await inviteCustomer('tenant-a', customer.id);
    await request(app.getHttpServer())
      .post('/client/claim')
      .set('Authorization', 'Bearer client-a')
      .expect(201);

    const response = await request(app.getHttpServer())
      .patch(`/quotes/${quote.id}/customer-response`)
      .set('Authorization', 'Bearer client-a')
      .send({
        decision: 'approve',
        comment: 'Please continue with the repair.',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: quote.id,
      status: 'approved',
    });
    expect((await findWorkOrder(workOrder.id))?.status).toBe('in_operation');

    const quoteAuditEvent = await auditEventModel
      .findOne({
        workshopId: 'workshop-a',
        entityType: 'quote',
        entityId: quote.id,
        action: 'quote_approved',
      })
      .lean();

    expect(quoteAuditEvent?.actorUserId).toBe('user-client-a');
    expect(quoteAuditEvent?.metadata).toMatchObject({
      source: 'client_portal',
      comment: 'Please continue with the repair.',
    });

    const persistedCustomer = await findCustomer(customer.id);
    expect(persistedCustomer?.authSubject).toBe('auth0|client-a');
  });

  it('allows the linked customer to reject a sent quote and records client portal audit metadata', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const service = await createService('tenant-a', true, 'Brake Noise');
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'QR-101',
    });
    const appointment = await createAppointment('tenant-a', service.id, {
      customerId: customer.id,
      vehicleId: vehicle.id,
    });
    const workOrder = await createWorkOrder('tenant-a', appointment.id);
    const diagnosticDraft = await createDiagnosticDraft('tenant-a', workOrder.id);
    const completedDiagnostic = await completeDiagnostic('tenant-a', diagnosticDraft.id);
    const quote = await createQuote('tenant-a', completedDiagnostic.id);
    await sendQuote('tenant-a', quote.id);

    const response = await request(app.getHttpServer())
      .patch(`/quotes/${quote.id}/customer-response`)
      .set('Authorization', 'Bearer client-a')
      .send({
        decision: 'reject',
        comment: 'I will wait for now.',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: quote.id,
      status: 'rejected',
    });
    expect((await findWorkOrder(workOrder.id))?.status).toBe('closed');

    const quoteAuditEvent = await auditEventModel
      .findOne({
        workshopId: 'workshop-a',
        entityType: 'quote',
        entityId: quote.id,
        action: 'quote_rejected',
      })
      .lean();

    expect(quoteAuditEvent?.actorUserId).toBe('user-client-a');
    expect(quoteAuditEvent?.metadata).toMatchObject({
      source: 'client_portal',
      comment: 'I will wait for now.',
    });
  });

  it('rejects customer responses when the quote is not sent', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    const service = await createService('tenant-a', true, 'Electrical Diagnosis');
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'QD-101',
    });
    const appointment = await createAppointment('tenant-a', service.id, {
      customerId: customer.id,
      vehicleId: vehicle.id,
    });
    const workOrder = await createWorkOrder('tenant-a', appointment.id);
    const diagnosticDraft = await createDiagnosticDraft('tenant-a', workOrder.id);
    const completedDiagnostic = await completeDiagnostic('tenant-a', diagnosticDraft.id);
    const quote = await createQuote('tenant-a', completedDiagnostic.id);

    await request(app.getHttpServer())
      .patch(`/quotes/${quote.id}/customer-response`)
      .set('Authorization', 'Bearer client-a')
      .send({
        decision: 'approve',
      })
      .expect(409);
  });

  it('rejects customer responses from the wrong customer or without authentication', async () => {
    const customer = await createCustomer('tenant-a', {
      name: 'Client A',
      email: 'client-a@test.local',
    });
    await createCustomer('tenant-a', {
      name: 'Client B',
      email: 'client-b@test.local',
    });
    const service = await createService('tenant-a', true, 'Suspension Diagnosis');
    const vehicle = await createVehicle('tenant-a', customer.id, {
      plate: 'QW-101',
    });
    const appointment = await createAppointment('tenant-a', service.id, {
      customerId: customer.id,
      vehicleId: vehicle.id,
    });
    const workOrder = await createWorkOrder('tenant-a', appointment.id);
    const diagnosticDraft = await createDiagnosticDraft('tenant-a', workOrder.id);
    const completedDiagnostic = await completeDiagnostic('tenant-a', diagnosticDraft.id);
    const quote = await createQuote('tenant-a', completedDiagnostic.id);
    await sendQuote('tenant-a', quote.id);

    await request(app.getHttpServer())
      .patch(`/quotes/${quote.id}/customer-response`)
      .set('Authorization', 'Bearer client-b')
      .send({
        decision: 'reject',
      })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/quotes/${quote.id}/customer-response`)
      .set('Authorization', 'Bearer client-other-tenant')
      .send({
        decision: 'reject',
      })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/quotes/${quote.id}/customer-response`)
      .send({
        decision: 'reject',
      })
      .expect(401);
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

  async function inviteCustomer(
    token: TestToken,
    customerId: string,
  ): Promise<{
    id: string;
    inviteStatus: 'not_invited' | 'invited' | 'claimed';
    invitedAt: string | null;
    claimedAt: string | null;
  }> {
    const response = await request(app.getHttpServer())
      .post(`/customers/${customerId}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    return response.body as {
      id: string;
      inviteStatus: 'not_invited' | 'invited' | 'claimed';
      invitedAt: string | null;
      claimedAt: string | null;
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

  async function findCustomer(id: string) {
    return await connection.collection('customers').findOne({ _id: new Types.ObjectId(id) });
  }

  async function expectAuditEvent(
    workshopId: string,
    entityType: 'work_order' | 'diagnostic' | 'quote',
    entityId: string,
    action:
      | 'work_order_created'
      | 'work_order_status_changed'
      | 'work_order_promises_changed'
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

  async function findNotificationByEvent(
    workshopId: string,
    workOrderId: string,
    eventType:
      | 'quote_sent'
      | 'work_order_promises_changed'
      | 'work_order_status_changed',
  ) {
    return await notificationModel
      .findOne({
        workshopId,
        workOrderId,
        eventType,
      })
      .sort({ createdAt: -1, _id: -1 })
      .lean();
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
