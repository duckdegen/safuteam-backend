import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    credentials: true,
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    allowedHeaders: ['content-type'],
    methods: ['GET', 'OPTIONS', 'POST'],
  });
  await app.listen(8080);
}
bootstrap();
