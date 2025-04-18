import { Controller, Post, Body, HttpException, HttpStatus, ClassSerializerInterceptor, UseInterceptors, HttpCode, UsePipes, ValidationPipe } from '@nestjs/common';

import { AccountingSeedService } from '@accounting/services';

import { apiResponse } from '@common/interfaces';
import { ApplyDecorators, CheckCmpy, CheckPeriodOpen, CheckWare } from '@common/decorators';
import { ParamSource } from '@common/enums';

@Controller('seed/accounting')
@UseInterceptors(ClassSerializerInterceptor)
export class AccountingSeedController {
    constructor(private readonly accountingSeedService: AccountingSeedService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        CheckWare(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async seedAccounting(
        @Body() body: { cmpy: string; ware: string }
    ): Promise<apiResponse<any>> {
        try {
            const { cmpy, ware } = body;

            if (!cmpy || !ware) {
                throw new HttpException(
                    'Se requieren los parámetros cmpy (compañía) y ware (sucursal)',
                    HttpStatus.BAD_REQUEST
                );
            }

            const result = await this.accountingSeedService.runSeed(cmpy, ware);

            return {
                message: result.message,
                data: { success: true }
            };
        } catch (error) {
            throw new HttpException(
                {
                    message: 'Error al generar seed de contabilidad',
                    error: error.message
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}