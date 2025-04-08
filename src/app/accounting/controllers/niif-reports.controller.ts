import { Controller, Post, Body, HttpException, HttpStatus, ClassSerializerInterceptor, UseInterceptors, HttpCode, UsePipes, ValidationPipe } from '@nestjs/common';

import { NiifReportsService } from '@accounting/services';

import { apiResponse } from '@common/interfaces';
import { GenerarNiifReporteDto } from '@accounting/dto';
import { ApplyDecorators, CheckCmpy, CheckWare } from '@common/decorators';
import { ParamSource } from '@common/enums';

@Controller('accounting/niif-reports')
@UseInterceptors(ClassSerializerInterceptor)
export class NiifReportsController {
    constructor(
        private readonly niifReportsService: NiifReportsService
    ) { }

    @Post('estado-resultados')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        CheckWare(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async generateEstadoResultados(
        @Body() reporteDto: GenerarNiifReporteDto
    ): Promise<apiResponse<any>> {
        try {
            const { cmpy, ware, year, per } = reporteDto;

            const estadoResultados = await this.niifReportsService.generateEstadoResultadosNiif(
                cmpy, ware, year, per
            );

            return {
                message: `Estado de resultados NIIF generado correctamente del año: ${year} periodo ${per}`,
                data: estadoResultados
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException({
                message: 'Error al generar el estado de resultados NIIF',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}