import { Controller, Get, Post, Query, Body, ClassSerializerInterceptor, UseInterceptors, HttpStatus, HttpCode, UsePipes, ValidationPipe } from '@nestjs/common';

import { Balance } from '@accounting/entities';
import { BalanceService } from '@accounting/services';

import { apiResponse } from '@common/interfaces';
import { ApplyDecorators, CheckCmpy, CheckWare } from '@common/decorators';
import { ParamSource } from '@common/enums';
@Controller('accounting/balance')
@UseInterceptors(ClassSerializerInterceptor)
export class BalanceController {
    constructor(private readonly accountingService: BalanceService) { }

    @Post('generate')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        CheckWare(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async generateBalance(
        @Body('cmpy') cmpy: string,
        @Body('ware') ware: string,
        @Body('year') year: number,
        @Body('per') per: number,
        @Body('type') type: string,
        @Body('userId') userId: string,
    ): Promise<apiResponse<Balance>> {
        const balance = await this.accountingService.generarBalance(
            cmpy,
            ware,
            year,
            per,
            type,
            userId,
        );

        let balanceType: string;
        switch (type) {
            case 'G':
                balanceType = 'General';
                break;
            case 'P':
                balanceType = 'de Prueba';
                break;
            case 'S':
                balanceType = 'de Situación';
                break;
            case 'R':
                balanceType = 'de Resultados';
                break;
            default:
                balanceType = '';
        }

        return {
            message: `Balance ${balanceType} generado correctamente para el período ${per} del año ${year}`,
            data: balance,
        };
    }

    @Post('generate-range')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        CheckWare(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async generateBalanceByDateRange(
        @Body('cmpy') cmpy: string,
        @Body('ware') ware: string,
        @Body('type') type: string,
        @Body('startDate') startDate: Date,
        @Body('endDate') endDate: Date,
        @Body('userId') userId: string,
    ): Promise<apiResponse<Balance>> {
        const balance = await this.accountingService.generarBalancePorRangoFechas(
            cmpy,
            ware,
            type,
            startDate,
            endDate,
            userId,
        );

        let balanceType: string;
        switch (type) {
            case 'G':
                balanceType = 'General';
                break;
            case 'P':
                balanceType = 'de Prueba';
                break;
            case 'S':
                balanceType = 'de Situación';
                break;
            case 'R':
                balanceType = 'de Resultados';
                break;
            default:
                balanceType = '';
        }

        return {
            message: `Balance ${balanceType} generado correctamente para el rango de fechas especificado`,
            data: balance,
        };
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.QUERY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async getBalance(
        @Query('cmpy') cmpy: string,
        @Query('year') year: number,
        @Query('per') per: number,
        @Query('type') type: string,
    ): Promise<apiResponse<{ balance: Balance, details: any[] }>> {
        const result = await this.accountingService.obtenerBalance(
            cmpy,
            year,
            per,
            type,
        );

        let balanceType: string;
        switch (type) {
            case 'G':
                balanceType = 'General';
                break;
            case 'P':
                balanceType = 'de Prueba';
                break;
            case 'S':
                balanceType = 'de Situación';
                break;
            case 'R':
                balanceType = 'de Resultados';
                break;
            default:
                balanceType = '';
        }

        return {
            message: `Balance ${balanceType} del período ${per} del año ${year}`,
            data: result,
        };
    }

    @Get('range')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.QUERY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async getBalancePorRangoFechas(
        @Query('cmpy') cmpy: string,
        @Query('startDate') startDate: Date,
        @Query('endDate') endDate: Date,
        @Query('type') type: string,
    ): Promise<apiResponse<{ balance: Balance, details: any[] }>> {
        const result = await this.accountingService.obtenerBalancePorRangoFechas(
            cmpy,
            startDate,
            endDate,
            type,
        );

        let balanceType: string;
        switch (type) {
            case 'G':
                balanceType = 'General';
                break;
            case 'P':
                balanceType = 'de Prueba';
                break;
            case 'S':
                balanceType = 'de Situación';
                break;
            case 'R':
                balanceType = 'de Resultados';
                break;
            default:
                balanceType = '';
        }

        return {
            message: `Balance ${balanceType} desde ${startDate} hasta ${endDate}`,
            data: result,
        };
    }

    @Get('types')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    getBalanceTypes(): apiResponse<any[]> {
        const balanceTypes = [
            { code: 'G', name: 'Balance General' },
            { code: 'P', name: 'Balance de Prueba' },
            { code: 'S', name: 'Balance de Situación' },
            { code: 'R', name: 'Estado de Resultados' },
        ];

        return {
            message: 'Tipos de balance disponibles',
            data: balanceTypes,
        };
    }
}

