import { Controller, Get, Post, Body, Query, Param, ClassSerializerInterceptor, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { SeatService } from '../service/seat.service';
import { TrimInterceptor } from 'src/app/common/interceptors/trim.interceptor';
import { AccountValidationPipe } from '../pipes/account-validation.pipe';
import { CrearSeatDto } from '../dto/crear-seat.dto';
import { ApplyDecorators, CheckCmpy, CheckPeriodOpen, CheckWare, } from 'src/app/common/decorators';
import { ParamSource } from 'src/app/common/enums';

@Controller('accounting/seat') 
@UseInterceptors(TrimInterceptor)
@UseInterceptors(ClassSerializerInterceptor)
export class SeatController {
    constructor(private seatService: SeatService) { }
    
    @Post()   
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),     
        CheckWare(ParamSource.BODY),      
        CheckPeriodOpen(ParamSource.BODY), 
        UsePipes(new ValidationPipe({ transform: true })) 
    ])
    async crearAsiento(
        @Body(AccountValidationPipe) data: CrearSeatDto,
    ) {
        return this.seatService.crearAsiento(data);
    }

    @Get('resumen')
    @ApplyDecorators([
        CheckCmpy(ParamSource.QUERY),     
        CheckWare(ParamSource.QUERY),      
        CheckPeriodOpen(ParamSource.QUERY), 
    ])   
    async obtenerResumen(
        @Query('cmpy') cmpy: string,
        @Query('ware') ware: string,
        @Query('year') year: number,
        @Query('per') per: number,
    ) {
        return this.seatService.obtenerResumenPorFechas(cmpy, ware, year, per);
    }

    @Get('codigo/:code')
    async obtenerPorCodigo(@Param('code') code: string) {
        return this.seatService.buscarPorCodigo(code);
    }
}