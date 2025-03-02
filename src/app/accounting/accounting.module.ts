import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Balance, BalanceDetail, Journal, Ledger, NoteHeader, NoteLine, Period, Puc, Seat } from './entities';
import { BalanceController, LedgerController, NoteController, PeriodController, PucController, SeatController } from './controllers';
import { BalanceService, LedgerService, NoteService, PeriodService, PucService, SeatService } from './service';
import { CheckCompanyGuard, CheckPeriodGuard, CheckSucursalGuard } from '../common/guards';
import { Sucursal } from '../settings/sucursal/entities';
import { Company } from '../settings/company/entities';

@Module({
    controllers: [PucController, SeatController, PeriodController, BalanceController, NoteController, LedgerController],
    providers: [PucService, SeatService, PeriodService, BalanceService, NoteService, LedgerService, CheckSucursalGuard,
        CheckCompanyGuard,
        CheckPeriodGuard,],
    imports: [
        TypeOrmModule.forFeature([Puc, Seat, Journal, BalanceDetail, Balance, Ledger, Period, NoteHeader, NoteLine, Sucursal, Company]),
    ],
    exports: [
        TypeOrmModule
    ]
})
export class AccountingModule { }
