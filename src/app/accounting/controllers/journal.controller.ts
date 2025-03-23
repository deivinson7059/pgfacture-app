// src/app/accounting/controller/ledger.controller.ts
import { Controller, Get, Query, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';

import { JournalService } from '@accounting/services';

import { apiResponse } from '@common/interfaces';

@Controller('accounting/journal') // Asegúrate de que este path sea correcto
@UseInterceptors(ClassSerializerInterceptor)
export class JournalController {
    constructor(private journalService: JournalService) { }

    @Get()
    async getJournal(
        @Query('cmpy') cmpy: string,
        @Query('ware') ware: string,
        @Query('year') year: number,
        @Query('per') per: number,
        @Query('account') account?: string,
    ): Promise<apiResponse<any>> {
        const entries = await this.journalService.findByFilters(cmpy, ware, year, per, account);
        return {
            message: `Libro diario del período ${per} del año ${year}`,
            data: entries
        };
    }
}