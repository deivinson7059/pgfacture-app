import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Balance, BalanceDetail, Journal, Ledger, NoteHeader, NoteLine, Period, Puc, Seat } from './entities';
import { BalanceController, LedgerController, NoteController, PeriodController, PucController, SeatController } from './controllers';
import { BalanceService, LedgerService, NoteService, PeriodService, PucService, SeatService } from './service';

@Module({
    controllers: [PucController, SeatController, PeriodController, BalanceController,NoteController,LedgerController],
    providers: [PucService, SeatService, PeriodService, BalanceService, NoteService,LedgerService],
    imports: [
        TypeOrmModule.forFeature([Puc, Seat, Journal, BalanceDetail, Balance, Ledger, Period, NoteHeader, NoteLine]),
    ],
    exports: [
        TypeOrmModule
    ]
})
export class AccountingModule { }
