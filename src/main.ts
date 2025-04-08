import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';


import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';


import { CustomHttpExceptionFilter } from './app/common/filters/http-exception.filter';
import { ResponseInterceptor } from './app/common/interceptors/response.interceptor';
import { TaskSettingsService } from './app/task-settings/task-settings.service';


async function bootstrap() {

    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Aplicar middleware de seguridad Helmet (protección de cabeceras HTTP)
    app.use(helmet());

    // Configurar CORS
    app.enableCors({
        origin: configService.get('CORS_ORIGIN', '*'),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    // Configurar límite de tasa para prevenir ataques de fuerza bruta
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100, // límite de 100 peticiones por windowMs
            message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo después de 15 minutos',
        }),
    );

    // Configurar validación global de entradas
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,// Eliminar propiedades que no están en los DTO
            forbidNonWhitelisted: true,// Rechazar peticiones con propiedades no definidas
            transform: true, // Transformar automáticamente a los tipos definidos
        }),
    );

    // Parser para cookies
    app.use(cookieParser());

    // Establecer la zona horaria a Colombia
    process.env.TZ = 'America/Bogota';

    // Aplica el interceptor globalmente
    // app.useGlobalInterceptors(new TrimInterceptor());

    // Aplicar el filtro de excepciones globalmente
    app.useGlobalFilters(new CustomHttpExceptionFilter());

    // Aplicar el interceptor globalmente
    app.useGlobalInterceptors(new ResponseInterceptor());

    //const taskService = app.get(TaskSettingsService);
    //await taskService.loadTasks();

    //app.setGlobalPrefix('api');

    const logger = new Logger('Bootstrap');

    await app.listen(configService.get('PORT', 3000));
    logger.log(`App running on port: ${configService.get('PORT', 3000)}`);
}
bootstrap();
