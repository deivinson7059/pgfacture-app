import { Controller, Get, Post, Body, Param, NotFoundException, BadRequestException, ClassSerializerInterceptor, Put, Query, UseInterceptors, UsePipes, ValidationPipe, HttpStatus, HttpCode } from '@nestjs/common';

import { Puc } from '@accounting/entities/puc.entity';

import { PucService } from '@accounting/services/puc.service';
import { CompanyService } from '@settings/services';

import { ApplyDecorators, CheckCmpy } from 'src/app/common/decorators';

import { allPucDto, CreatePucDto, UpdatePucDto } from '@accounting/dto';
import { ListPucDto, SearchPucDto } from '@accounting/dto';

import { PucResponse, PucResponseOnly } from '@accounting/interfaces';
import { apiResponse } from '@common/interfaces/common.interface';

import { ParamSource } from '@common/enums';

@Controller('accounting/puc')
@UseInterceptors(ClassSerializerInterceptor)
export class PucController {
    constructor(
        /* private readonly Service: Service, */
        private readonly PucService: PucService,
        private readonly companyService: CompanyService,

    ) { }

    @Post()
    async create(@Body() accountPlanDto: CreatePucDto): Promise<Puc> {
        return this.PucService.create(accountPlanDto);
    }

    @Put()
    async update(@Body() accountPucDto: UpdatePucDto): Promise<Puc> {
        return this.PucService.update(accountPucDto);
    }

    @Get(':cmpy')
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async listCatalog(@Param('cmpy') cmpy: string, @Query() query: ListPucDto): Promise<PucResponse> {
        // Aquí puedes hacer la validación adicional si necesitas más lógica
        if (!cmpy) {
            throw new BadRequestException('cmpy es requerido');
        }
        return {
            message: "Listado de Cuentas",
            data: await this.PucService.listCatalog(cmpy)
        };
    }

    @Get(':cmpy/account/:accountId')
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async getAccountHierarchy(
        @Param('cmpy') cmpy: string,
        @Param('accountId') accountId: string
    ): Promise<PucResponseOnly> {
        if (!cmpy || !accountId) {
            throw new BadRequestException('cmpy y account son requeridos');
        }

        // accountId debe ser un número
        if (isNaN(+accountId)) {
            throw new BadRequestException('account debe ser un número');
        }
        return {
            message: `Detalle de la cuenta ${accountId}`,
            data: await this.PucService.getAccountHierarchy(cmpy, accountId),
        };
    }

    /**
    * Busca cuentas auxiliares según compañía y cuenta, limitado a 100 resultados
    * Determina automáticamente si buscar por número o descripción
    */
    @Post('/search')
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async searchAccounts(
        @Body() searchDto: SearchPucDto
    ): Promise<apiResponse<Puc[]>> {

        const { cmpy, account } = searchDto
        if (!cmpy) {
            throw new BadRequestException('El código de compañía es requerido');
        }

        if (!account) {
            throw new BadRequestException('El parámetro de búsqueda es requerido');
        }

        // Usar el cmpy y la cuenta del body
        const accounts = await this.PucService.searchAuxiliaryAccounts(
            cmpy,
            account,
            100 // Límite fijo de 100 resultados
        );

        return {
            message: "Resultados de búsqueda",
            data: accounts
        };
    }

    /**
   * Cargar todas las cuentas auxiliares según compañía, limitado a 300 resultados
   */
    @Post('/all')
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    @HttpCode(HttpStatus.OK)
    async searchAccountsAll(
        @Body() searchDto: allPucDto
    ): Promise<apiResponse<Puc[]>> {

        const { cmpy } = searchDto
        if (!cmpy) {
            throw new BadRequestException('El código de compañía es requerido');
        }

        // Usar el cmpy del body
        const accounts = await this.PucService.auxiliaryAccounts(
            cmpy,
            300 // Límite fijo de 300 resultados
        );

        return {
            message: "Listado de cuentas auxiliares",
            data: accounts
        };
    }
}