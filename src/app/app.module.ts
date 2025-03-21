import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TaskSettingsModule } from './task-settings/task-settings.module';
import { SettingsModule } from './settings/settings.module';
import { ReportsModule } from './reports/reports.module';
import { PayrollModule } from './payroll/payroll.module';
import { InventoryModule } from './inventory/inventory.module';
import { IncomeModule } from './income/income.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AccountingModule } from './accounting/accounting.module';
import { SeedModule } from './seed/seed.module';
import { SharedModule } from './shared/shared.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            autoLoadEntities: true, // Carga automáticamente las entidades
            schema: 'pgfacture', // CREATE SCHEMA pgfacture;
            database: process.env.DB_NAME, // Nombre de la base de datos
            host: process.env.DB_HOST, // Host de la base de datos
            password: process.env.DB_PASSWORD, // Contraseña de la base de datos
            port: +process.env.DB_PORT! || 5432, // Puerto de la base de datos
            synchronize: true, // Sincroniza el esquema de la base de datos (solo para desarrollo)
            type: 'postgres', // Tipo de base de datos
            username: process.env.DB_USERNAME, // Usuario de la base de datos
            extra: {
                options: '-c timezone=America/Bogota', // Establece la zona horaria
            },
        }),
        AuthModule,
        //TaskSettingsModule,
        SeedModule,
        SettingsModule,
        ReportsModule,
        PayrollModule,
        InventoryModule,
        IncomeModule,
        ExpensesModule,
        AccountingModule,
        SharedModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
