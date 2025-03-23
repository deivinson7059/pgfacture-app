import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Balance, BalanceDetail, Journal, Ledger, NoteHeader, NoteLine, Period, Puc, Seat } from '@accounting/entities';
import { Company, Sucursal } from '@settings/entities';
import { Comment } from '@shared/entities';

import { BalanceController, JournalController, LedgerController, NoteController, PeriodController, PucController, SeatController, NiifReportsController, AccountingSeedController } from '@accounting/controllers';

import { AccountingSeedService, BalanceService, JournalService, LedgerService, NiifReportsService, NoteService, PeriodService, PucService, SeatService } from '@accounting/services';
import { CompanyService } from '@settings/services';
import { CommentService } from '@shared/services';

import { CheckCompanyGuard, CheckPeriodGuard, CheckSucursalGuard } from '@common/guards';


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
        CommentService
    ],
    imports: [
        TypeOrmModule.forFeature(
            [
                Comment,
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
