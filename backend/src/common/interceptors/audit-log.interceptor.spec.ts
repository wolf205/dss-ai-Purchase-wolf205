import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { AuditService } from '../../modules/audit/audit.service';
import { AuditLogOptions } from '../decorators/audit-log.decorator';

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let reflector: Reflector;
  let auditService: AuditService;

  beforeEach(() => {
    reflector = new Reflector();
    auditService = {
      createLog: jest.fn().mockResolvedValue({ id: 1n }),
    } as unknown as AuditService;

    interceptor = new AuditLogInterceptor(reflector, auditService);
  });

  const createMockExecutionContext = (req: Record<string, unknown> = {}) => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          method: 'POST',
          url: '/api/v1/test',
          ...req,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should pass through if no @AuditLog decorator is present', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockExecutionContext();
    const next: CallHandler = {
      handle: () => of({ success: true, data: 'test' }),
    };

    interceptor.intercept(context, next).subscribe({
      next: (val) => {
        expect(val).toEqual({ success: true, data: 'test' });
        expect(auditService.createLog).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should record audit log in background when @AuditLog decorator is present', (done) => {
    const auditOptions: AuditLogOptions = {
      action: 'TEST_ACTION',
      entityType: 'TestEntity',
      entityId: '99',
      description: 'Mô tả test',
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(auditOptions);

    const mockReq = {
      user: { id: '1', username: 'tester', role: 'STORE_MANAGER' },
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
      ip: '127.0.0.1',
    };

    const context = createMockExecutionContext(mockReq);
    const next: CallHandler = {
      handle: () => of({ success: true, data: { id: 99 } }),
    };

    interceptor.intercept(context, next).subscribe({
      next: (val) => {
        expect(val).toEqual({ success: true, data: { id: 99 } });

        // Cho microtask background promise chạy
        setImmediate(() => {
          expect(auditService.createLog).toHaveBeenCalledWith({
            userId: '1',
            username: 'tester',
            action: 'TEST_ACTION',
            entityType: 'TestEntity',
            entityId: '99',
            description: 'Mô tả test',
            metadata: {
              method: 'POST',
              path: '/api/v1/test',
            },
            ipAddress: '203.0.113.195',
          });
          done();
        });
      },
    });
  });

  it('should execute custom callbacks for entityId, description, and extractMetadata', (done) => {
    const auditOptions: AuditLogOptions = {
      action: 'CUSTOM_ACTION',
      entityType: 'DynamicEntity',
      entityId: (_req, resData) => (resData as { customId: string }).customId,
      description: (_req, resData) =>
        `Action on ${(resData as { customId: string }).customId}`,
      extractMetadata: (_req, resData) => ({
        extra: (resData as { extra: string }).extra,
      }),
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(auditOptions);

    const mockReq = {
      user: { id: '2', username: 'custom_user', role: 'STORE_MANAGER' },
      ip: '192.168.1.50',
    };

    const context = createMockExecutionContext(mockReq);
    const next: CallHandler = {
      handle: () => of({ customId: 'DYN-123', extra: 'value' }),
    };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        setImmediate(() => {
          expect(auditService.createLog).toHaveBeenCalledWith({
            userId: '2',
            username: 'custom_user',
            action: 'CUSTOM_ACTION',
            entityType: 'DynamicEntity',
            entityId: 'DYN-123',
            description: 'Action on DYN-123',
            metadata: { extra: 'value' },
            ipAddress: '192.168.1.50',
          });
          done();
        });
      },
    });
  });

  it('should not fail the response even if auditService.createLog throws in background', (done) => {
    const auditOptions: AuditLogOptions = {
      action: 'FAIL_ACTION',
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(auditOptions);
    (auditService.createLog as jest.Mock).mockRejectedValue(
      new Error('DB connection failed'),
    );

    const context = createMockExecutionContext({
      user: { username: 'err_user' },
    });
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    interceptor.intercept(context, next).subscribe({
      next: (val) => {
        expect(val).toEqual({ ok: true });
        setImmediate(() => {
          expect(auditService.createLog).toHaveBeenCalled();
          done();
        });
      },
    });
  });

  it('should not record audit log if request fails (throws error)', (done) => {
    const auditOptions: AuditLogOptions = {
      action: 'ERROR_ACTION',
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(auditOptions);

    const context = createMockExecutionContext();
    const next: CallHandler = {
      handle: () => throwError(() => new Error('Business error')),
    };

    interceptor.intercept(context, next).subscribe({
      error: (err) => {
        expect(err.message).toBe('Business error');
        expect(auditService.createLog).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
