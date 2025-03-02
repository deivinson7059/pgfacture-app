import { Controller, Get, Post, Body, Param, Query, Put, ParseIntPipe, UseGuards, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { CreatePeriodDto, CreateYearPeriodsDto } from '../dto/create-period.dto';
import { apiResponse } from 'src/app/common/interfaces/common.interface';
import { Period } from '../entities/period.entity';
import { PeriodService } from '../service';
import { TrimInterceptor } from 'src/app/common/interceptors/trim.interceptor';

@Controller('accounting/period')
@UseInterceptors(TrimInterceptor)
@UseInterceptors(ClassSerializerInterceptor)
export class PeriodController {
    constructor(private readonly periodService: PeriodService) { }

    @Get()
    async findAll(
        @Query('cmpy') cmpy: string,
        @Query('year') year?: number,
    ): Promise<apiResponse<Period[]>> {
        const periods = await this.periodService.findAll(cmpy, year);
        return {
            message: 'Períodos contables',
            data: periods,
        };
    }

    @Get(':cmpy/:year/:per')
    async findOne(
        @Param('cmpy') cmpy: string,
        @Param('year', ParseIntPipe) year: number,
        @Param('per', ParseIntPipe) per: number,
    ): Promise<apiResponse<Period>> {
        const period = await this.periodService.findOne(cmpy, year, per);
        return {
            message: `Información del período ${per} del año ${year}`,
            data: period,
        };
    }

    @Post()
    async create(
        @Body() createPeriodDto: CreatePeriodDto,
    ): Promise<apiResponse<Period>> {
        const period = await this.periodService.create(createPeriodDto);
        return {
            message: `Período ${period.accp_per} del año ${period.accp_year} creado correctamente`,
            data: period,
        };
    }

    @Post('year')
    async createYearPeriods(
        @Body() createYearPeriodsDto: CreateYearPeriodsDto,
    ): Promise<apiResponse<Period[]>> {
        const periods = await this.periodService.createYearPeriods(createYearPeriodsDto);
        return {
            message: `Períodos del año ${createYearPeriodsDto.year} creados correctamente`,
            data: periods,
        };
    }

    @Put('close/:cmpy/:year/:per')
    async closePeriod(
        @Param('cmpy') cmpy: string,
        @Param('year', ParseIntPipe) year: number,
        @Param('per', ParseIntPipe) per: number,
        @Body('userId') userId: string,
    ): Promise<apiResponse<Period>> {
        const period = await this.periodService.closePeriod(cmpy, year, per, userId);

        const message = per === 13
            ? `Cierre anual del año ${year} completado correctamente. Se han creado los períodos para el año ${year + 1}.`
            : `Período ${per} del año ${year} cerrado correctamente`;

        return {
            message,
            data: period,
        };
    }
}