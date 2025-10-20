import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { config } from 'dotenv';

async function bootstrap() {
  config(); // ✅ Load environment variables

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ✅ Global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ✅ Enable CORS globally
  app.enableCors();

  // ✅ Set global prefix (example: http://localhost:3000/api)
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // ✅ Serve static test page from /public at root URL
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // ✅ Define port (from .env or fallback to 3000)
  let port: number = Number(process.env.PORT) || 3000;

  // ✅ Start server with automatic retry if port is in use
  const maxRetries = 5;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await app.listen(port);
      Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
      break;
    } catch (error: any) {
      if (error?.code === 'EADDRINUSE' && attempt < maxRetries) {
        Logger.warn(`Port ${port} is in use. Retrying on port ${port + 1}...`);
        port += 1;
        continue;
      }
      throw error;
    }
  }
}

bootstrap();
