import { Module } from '@nestjs/common';

import { InvoiceService } from './invoice/invoice.service';
import { InvoiceController } from './invoice/invoice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceHead } from './invoice/entities/invoice-head.entity';
import { InvoiceLine } from './invoice/entities/invoice-line.entity';
import { SettingsModule } from '../settings/settings.module';


@Module({
    controllers: [
        InvoiceController
    ],
    providers: [
        InvoiceService
    ],
    imports: [
        TypeOrmModule.forFeature(
            [
                InvoiceHead,
                InvoiceLine
            ]
        ),
        SettingsModule
    ],
    exports: [
        TypeOrmModule
    ],
})
export class IncomeModule { }
