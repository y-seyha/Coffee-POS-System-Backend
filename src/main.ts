import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const app =
        await NestFactory.create<NestExpressApplication>(
            AppModule
        );

    app.set('trust proxy', 1);

    // cors
    app.enableCors({
        origin: [
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'https://coffee-pos-rho.vercel.app',
            'https://coffeesteavpos.app',
            'https://app.coffeesteavpos.app',
            'https://www.coffeesteavpos.app',
        ],
        credentials: true,
    });

    // use global /api
    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    );

    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Coffee POS System API')
            .setDescription('API documentation for Coffee POS System')
            .setVersion('1.0')
            .addBearerAuth({type: 'http', scheme: 'bearer', bearerFormat: 'JWT'})
            .build();

        const document =
            SwaggerModule.createDocument(app, config);

        SwaggerModule.setup(
            'swagger-documents',
            app,
            document,
            {
                useGlobalPrefix: false,
                swaggerOptions: {
                    persistAuthorization: true,
                },
            }
        );
    }

    // cookie proxy
    app.use(cookieParser());

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();