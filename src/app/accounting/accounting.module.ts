import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Balance, BalanceDetail, Journal, Ledger, NoteHeader, NoteLine, Period, Puc, Seat } from './entities';
import { BalanceController, JournalController, LedgerController, NoteController, PeriodController, PucController, SeatController } from './controllers';
import { AccountingSeedService, BalanceService, JournalService, LedgerService, NiifReportsService, NoteService, PeriodService, PucService, SeatService } from './service';
import { CheckCompanyGuard, CheckPeriodGuard, CheckSucursalGuard } from '../common/guards';
import { NiifReportsController } from './controllers/niif-reports.controller';
import { AccountingSeedController } from './controllers/seed.controller';
import { CompanyService } from '../settings/services/company.service';
import { Company, Sucursal } from '../settings/entities';

@Module({
    controllers: [
        PucController,
        SeatController,
        PeriodController,
        BalanceController,
        NoteController,
        LedgerController,
        JournalController,
        NiifReportsController,
        AccountingSeedController
    ],
    providers: [
        PucService,
        SeatService,
        PeriodService,
        BalanceService,
        JournalService,
        NoteService,
        LedgerService,
        AccountingSeedService,
        NiifReportsService,
        CheckSucursalGuard,
        CheckCompanyGuard,
        CheckPeriodGuard,
        CompanyService,
    ],
    imports: [
        TypeOrmModule.forFeature(
            [
                Puc,
                Seat,
                Journal,
                BalanceDetail,
                Balance,
                Ledger,
                Period,
                NoteHeader,
                NoteLine,
                Sucursal,
                Company
            ]),
    ],
    exports: [
        TypeOrmModule
    ]
})
export class AccountingModule { }
