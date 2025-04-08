import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvoiceController } from './controllers';
import { InvoiceService } from './services';

import { InvoiceHead, InvoiceLine } from './entities';
import { SettingsModule } from '@settings/settings.module';

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
