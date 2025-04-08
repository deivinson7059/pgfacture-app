// src/app/accounting/controller/ledger.controller.ts
import { Controller, Get, Query, ClassSerializerInterceptor, UseInterceptors, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';

import { JournalService } from '@accounting/services';

import { apiResponse } from '@common/interfaces';
import { ApplyDecorators, CheckCmpy, CheckWare } from '@common/decorators';
import { ParamSource } from '@common/enums';

@Controller('accounting/journal') // Asegúrate de que este path sea correcto
@UseInterceptors(ClassSerializerInterceptor)
export class JournalController {
    constructor(private journalService: JournalService) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.QUERY),
        CheckWare(ParamSource.QUERY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
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