import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Balance, BalanceDetail, Journal, Ledger, NoteHeader, NoteLine, Period, Puc, Seat } from './entities';
import { BalanceController, JournalController, LedgerController, NoteController, PeriodController, PucController, SeatController } from './controllers';
import { BalanceService, JournalService, LedgerService, NoteService, PeriodService, PucService, SeatService } from './service';
import { CheckCompanyGuard, CheckPeriodGuard, CheckSucursalGuard } from '../common/guards';
import { Sucursal } from '../settings/sucursal/entities';
import { Company } from '../settings/company/entities';

@Module({
    controllers: [
        PucController,
        SeatController,
        PeriodController,
        BalanceController,
        NoteController,
        LedgerController,
        JournalController
    ],
    providers: [
        PucService,
        SeatService,
        PeriodService,
        BalanceService,
        JournalService,
        NoteService,
        LedgerService,
        CheckSucursalGuard,
        CheckCompanyGuard,
        CheckPeriodGuard,
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
