import { Controller, Get, Post, Body, Param, NotFoundException, BadRequestException, ClassSerializerInterceptor, Put, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { PucService } from '../service/puc.service';
import { PucResponse, PucResponseOnly } from '../interfaces/puc.interface';
import { allPucDto, CreatePucDto, UpdatePucDto } from '../dto';
import { ListPucDto, SearchPucDto } from '../dto';
import { Puc } from '../entities/puc.entity';
import { CompanyService } from 'src/app/settings/company/company.service';
import { apiResponse } from 'src/app/common/interfaces/common.interface';
import { ApplyDecorators, CheckCmpy } from 'src/app/common/decorators';
import { ParamSource } from 'src/app/common/enums';

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
    @UsePipes(new ValidationPipe({ transform: true }))
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
    * Busca cuentas auxiliares según compañía y cuenta, limitado a 10 resultados
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

        // Usar el cmpy de la URL y la cuenta del body
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
   * Cargar todas las cuentas auxiliares según compañía y cuenta, limitado a 10 resultados
   */
    @Post('/all')
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async searchAccountsAll(
        @Body() searchDto: allPucDto
    ): Promise<apiResponse<Puc[]>> {

        const { cmpy } = searchDto
        if (!cmpy) {
            throw new BadRequestException('El código de compañía es requerido');
        }       

        // Usar el cmpy de la URL y la cuenta del body
        const accounts = await this.PucService.auxiliaryAccounts(
            cmpy,
            300 // Límite fijo de 100 resultados
        );

        return {
            message: "Resultados de búsqueda",
            data: accounts
        };
    }
}
