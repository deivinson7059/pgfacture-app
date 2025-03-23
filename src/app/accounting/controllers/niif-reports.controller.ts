import { Controller, Post, Body, HttpException, HttpStatus, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';

import { NiifReportsService } from '@accounting/services';

import { apiResponse } from '@common/interfaces';
import { GenerarNiifReporteDto } from '@accounting/dto';

@Controller('accounting/niif-reports')
@UseInterceptors(ClassSerializerInterceptor)
export class NiifReportsController {
    constructor(
        private readonly niifReportsService: NiifReportsService
    ) { }

    @Post('estado-resultados')
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