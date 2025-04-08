// src/app/accounting/controller/ledger.controller.ts
import { Controller, Get, Query, ClassSerializerInterceptor, UseInterceptors, HttpCode, UsePipes, ValidationPipe, HttpStatus } from '@nestjs/common';

import { LedgerService } from '@accounting/services';

import { apiResponse } from '@common/interfaces';
import { ApplyDecorators, CheckCmpy, CheckWare } from '@common/decorators';
import { ParamSource } from '@common/enums';

@Controller('accounting/ledger') // Asegúrate de que este path sea correcto
@UseInterceptors(ClassSerializerInterceptor)
export class LedgerController {
    constructor(private ledgerService: LedgerService) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.QUERY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async getLedger(
        @Query('cmpy') cmpy: string,
        @Query('year') year: number,
        @Query('per') per: number,
        @Query('account') account?: string,
    ): Promise<apiResponse<any>> {
        const entries = await this.ledgerService.findByFilters(cmpy, year, per, account);
        return {
            message: `Libro mayor del período ${per} del año ${year}`,
            data: entries
        };
    }
}