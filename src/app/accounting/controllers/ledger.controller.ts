// src/app/accounting/controller/ledger.controller.ts
import { Controller, Get, Query, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { apiResponse } from 'src/app/common/interfaces/common.interface';
import { LedgerService } from '../service';

@Controller('accounting/ledger') // Asegúrate de que este path sea correcto
export class LedgerController {
    constructor(private ledgerService: LedgerService) { }

    @Get()
    async getLedger(
        @Query('cmpy') cmpy: string,
        @Query('ware') ware: string,
        @Query('year') year: number,
        @Query('per') per: number,
        @Query('account') account?: string,
    ): Promise<apiResponse<any>> {
        const entries = await this.ledgerService.findByFilters(cmpy, ware, year, per, account);
        return {
            message: `Libro mayor del período ${per} del año ${year}`,
            data: entries
        };
    }
}