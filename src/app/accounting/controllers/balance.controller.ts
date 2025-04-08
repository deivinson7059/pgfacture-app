import { Controller, Get, Post, Query, Body, ClassSerializerInterceptor, UseInterceptors, HttpStatus, HttpCode, UsePipes, ValidationPipe, Logger, UseGuards } from '@nestjs/common';

import { Balance } from '@accounting/entities';
import { BalanceService } from '@accounting/services';

import { apiResponse } from '@common/interfaces';
import { ApplyDecorators, CheckCmpy, CheckWare } from '@common/decorators';
import { ParamSource } from '@common/enums';
import { CheckCompanyGuard, CheckPeriodGuard, CheckSucursalGuard } from '@common/guards';

@Controller('accounting/balance')
@UseInterceptors(ClassSerializerInterceptor)
export class BalanceController {
    private readonly logger = new Logger(BalanceController.name);

    constructor(private readonly accountingService: BalanceService) { }

    @Post('generate')
    @HttpCode(HttpStatus.OK)
    @UseGuards(CheckCompanyGuard, CheckSucursalGuard)
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
        this.logger.log(`Generating balance for company ${cmpy}, warehouse ${ware}, year ${year}, period ${per}, type ${type}`);

        // Validar el tipo de balance
        this.validateBalanceType(type);

        // Validar el año y período
        this.validateYearAndPeriod(year, per);

        const balance = await this.accountingService.generarBalance(
            cmpy,
            ware,
            year,
            per,
            type,
            userId,
        );

        let balanceType: string = this.getBalanceTypeDescription(type);

        return {
            message: `Balance ${balanceType} generado correctamente para el período ${per} del año ${year}`,
            data: balance,
        };
    }

    @Post('generate-range')
    @HttpCode(HttpStatus.OK)
    @UseGuards(CheckCompanyGuard, CheckSucursalGuard)
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
        this.logger.log(`Generating balance by date range for company ${cmpy}, warehouse ${ware}, type ${type}, from ${startDate} to ${endDate}`);

        // Validar el tipo de balance
        this.validateBalanceType(type);

        // Validar fechas
        this.validateDateRange(startDate, endDate);

        const balance = await this.accountingService.generarBalancePorRangoFechas(
            cmpy,
            ware,
            type,
            startDate,
            endDate,
            userId,
        );

        let balanceType: string = this.getBalanceTypeDescription(type);

        return {
            message: `Balance ${balanceType} generado correctamente para el rango de fechas especificado`,
            data: balance,
        };
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @UseGuards(CheckCompanyGuard)
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
        this.logger.log(`Getting balance for company ${cmpy}, year ${year}, period ${per}, type ${type}`);

        // Validar el tipo de balance
        this.validateBalanceType(type);

        // Validar el año y período
        this.validateYearAndPeriod(year, per);

        const result = await this.accountingService.obtenerBalance(
            cmpy,
            year,
            per,
            type,
        );

        let balanceType: string = this.getBalanceTypeDescription(type);

        return {
            message: `Balance ${balanceType} del período ${per} del año ${year}`,
            data: result,
        };
    }

    @Get('range')
    @HttpCode(HttpStatus.OK)
    @UseGuards(CheckCompanyGuard)
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
        this.logger.log(`Getting balance by date range for company ${cmpy}, type ${type}, from ${startDate} to ${endDate}`);

        // Validar el tipo de balance
        this.validateBalanceType(type);

        // Validar fechas
        this.validateDateRange(startDate, endDate);

        const result = await this.accountingService.obtenerBalancePorRangoFechas(
            cmpy,
            startDate,
            endDate,
            type,
        );

        let balanceType: string = this.getBalanceTypeDescription(type);

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

    // Métodos privados para validación

    private validateBalanceType(type: string): void {
        const validTypes = ['G', 'P', 'S', 'R'];
        if (!validTypes.includes(type)) {
            throw new Error(`Tipo de balance inválido: ${type}. Debe ser uno de: ${validTypes.join(', ')}`);
        }
    }

    private validateYearAndPeriod(year: number, per: number): void {
        if (year < 2000 || year > 2100) {
            throw new Error(`Año inválido: ${year}. Debe estar entre 2000 y 2100.`);
        }

        if (per < 1 || per > 13) {
            throw new Error(`Período inválido: ${per}. Debe estar entre 1 y 13.`);
        }
    }

    private validateDateRange(startDate: Date, endDate: Date): void {
        if (startDate > endDate) {
            throw new Error('La fecha inicial no puede ser posterior a la fecha final.');
        }

        // Verificar que el rango no sea mayor a un año
        const oneYearLater = new Date(startDate);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

        if (endDate > oneYearLater) {
            throw new Error('El rango de fechas no puede ser mayor a un año.');
        }
    }

    private getBalanceTypeDescription(type: string): string {
        switch (type) {
            case 'G': return 'General';
            case 'P': return 'de Prueba';
            case 'S': return 'de Situación';
            case 'R': return 'de Resultados';
            default: return '';
        }
    }
}