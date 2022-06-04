import { LogLevel, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { PrismaClientExceptionFilter, PrismaService } from 'nestjs-prisma';

import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: [
      'log',
      'warn',
      'error',
      config.nodeEnv !== 'production' && 'debug',
      config.nodeEnv !== 'production' && config.verbose && 'verbose',
    ].filter(Boolean) as LogLevel[],
  });

  // Add /api prefix to all routes
  const apiPath = config.basePath ? config.basePath.slice(1) + '/api' : 'api';
  app.setGlobalPrefix(apiPath);

  // Validate all requests
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Enable shutdown hook
  const prismaService: PrismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  // Handle Prisma client exceptions
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  // Cookie parser
  app.use(cookieParser(config.cookieSecret));

  // Setup swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tarrasque API')
    .setDescription('Mobile-friendly & open-source virtual tabletop for Dungeons & Dragons')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(apiPath, app, document);

  // Start server
  await app.listen(config.port);
}
bootstrap();
