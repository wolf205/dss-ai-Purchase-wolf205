import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// Polyfill BigInt.prototype.toJSON to safely serialize Prisma BigInt columns to string
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Cookie Parser Middleware (chuẩn bị nhận Refresh Token HttpOnly Cookie)
  app.use(cookieParser());

  // 2. Cấu hình CORS an toàn hỗ trợ trao đổi Cookie với Frontend
  const rawOrigins = configService.get<string>(
    'CLIENT_ORIGIN',
    'http://localhost:5173,http://localhost:80',
  );
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (e.g. mobile apps, curl, server-to-server)
      // hoặc nguồn localhost hợp lệ
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:')
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 3. Tiền tố toàn cục API (Global Prefix /api/v1)
  app.setGlobalPrefix('api/v1');

  // 4. Global Validation Pipe chuẩn hóa DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 5. Global Standard API Envelope Interceptor & Error Filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // 6. Cấu hình Swagger API Documentation tại /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DSS AI-Purchase API')
    .setDescription(
      'Hệ thống Hỗ trợ Ra Quyết Định Mua Hàng cho Cửa Hàng Bán Lẻ Đơn Lẻ (Decision Support System - DSS). ' +
        'Tài liệu hợp đồng giao tiếp API kỹ thuật theo chuẩn RESTful.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập Access Token JWT vào đây',
        in: 'header',
      },
      'access-token',
    )
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
      description: 'Refresh Token lưu trong HttpOnly Cookie',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'DSS AI-Purchase API Docs',
  });

  // 7. Lắng nghe trên cổng chỉ định (mặc định 3000)
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 DSS Backend is running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
  logger.log(
    `🩺 Health Check endpoint at: http://localhost:${port}/api/v1/health`,
  );
}

bootstrap().catch((err) => {
  const logger = new Logger('BootstrapError');
  logger.error('Failed to start DSS Backend server', err);
  process.exit(1);
});
