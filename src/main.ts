import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app/app.module';

import { CustomHttpExceptionFilter } from './app/common/filters/http-exception.filter';
import { ResponseInterceptor } from './app/common/interceptors/response.interceptor';
import { TaskSettingsService } from './app/task-settings/task-settings.service';

import * as cors from 'cors';

async function bootstrap() {
  // Establecer la zona horaria a Colombia
  process.env.TZ = 'America/Bogota';

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(cors({ origin: '*' }));
  //app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Aplica el interceptor globalmente
 // app.useGlobalInterceptors(new TrimInterceptor());

   // Aplicar el filtro de excepciones globalmente
   app.useGlobalFilters(new CustomHttpExceptionFilter());

   // Aplicar el interceptor globalmente
  app.useGlobalInterceptors(new ResponseInterceptor());

  //const taskService = app.get(TaskSettingsService);
  //await taskService.loadTasks();

  await app.listen(process.env.PORT || 3002);
  logger.log(`App running on port: ${process.env.PORT || 3002}`);
}
bootstrap();
