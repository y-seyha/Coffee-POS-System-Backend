import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //use global /api
    app.setGlobalPrefix('api');

  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
  );

    const config = new DocumentBuilder()
        .setTitle('Coffee POS System API')
        .setDescription('API documentation for Coffee POS System')
        .setVersion('1.0') // API version
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger-documents', app, document, {
        useGlobalPrefix: false,
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    //cookie middleware
    app.use(cookieParser());console.log('🔥 APP STARTED');


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
