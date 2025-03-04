import { Controller, Get, Post, Query, Body, Param, ParseIntPipe, ParseDatePipe } from '@nestjs/common';
import { apiResponse } from 'src/app/common/interfaces/common.interface';
import { Balance } from '../entities';
import { BalanceService } from '../service';

@Controller('accounting/balance')
export class BalanceController {
  constructor(private readonly accountingService: BalanceService) {}

  @Post('generate')
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
  async getBalance(
    @Query('cmpy') cmpy: string,
    @Query('year') year: number,
    @Query('per') per: number,
    @Query('type') type: string,
    @Query('date') date: Date,
  ): Promise<apiResponse<{balance: Balance, details: any[]}>> {
    const result = await this.accountingService.obtenerBalance(
      cmpy,
      year,
      per,
      type,
      date,
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

  

  @Get('types')
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