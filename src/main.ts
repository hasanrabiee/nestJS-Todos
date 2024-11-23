import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('NestJS Application API')
    .setDescription('API documentation for the NestJS application')
    .setVersion('1.0')
    .addTag('users') // Add a tag for grouping endpoints
    .addCookieAuth('Authentication', {
      type: 'apiKey', // Use `apiKey` for cookies
      in: 'cookie', // Specify `cookie` as the location
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);
  await app.listen(3000);
}
bootstrap();
