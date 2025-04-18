import { Controller, Get, Post, Body, Param, Query, Put, ParseIntPipe, ClassSerializerInterceptor, UseInterceptors, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';

import { Period } from '@accounting/entities';

import { PeriodService } from '@accounting/services';

import { CreatePeriodDto, CreateYearPeriodsDto } from '@accounting/dto';
import { apiResponse } from '@common/interfaces';
import { ApplyDecorators, CheckCmpy } from '@common/decorators';
import { ParamSource } from '@common/enums';


@Controller('accounting/period')
@UseInterceptors(ClassSerializerInterceptor)
export class PeriodController {
    constructor(private readonly periodService: PeriodService) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.QUERY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
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
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
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
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
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
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
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
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
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