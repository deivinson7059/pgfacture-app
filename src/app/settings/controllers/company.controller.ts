import { Controller, Get, Post, Body, Param, Delete, NotFoundException, Put, ClassSerializerInterceptor, UseInterceptors, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { apiResponse } from '../../common/interfaces/common.interface';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto';
import { Company } from '../entities';
import { CompanyService } from '../services/company.service';
import { ApplyDecorators, CheckCmpy } from '@common/decorators';
import { ParamSource } from '@common/enums';
import { Public } from '@auth/decorators';

@Controller('settings/company')
@UseInterceptors(ClassSerializerInterceptor)
export class CompanyController {
    constructor(
        private readonly CompanyService: CompanyService,
    ) { }


    @Public()
    @Post()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async createCompany(@Body() createCompanyDto: CreateCompanyDto): Promise<apiResponse<Company>> {
        return this.CompanyService.create(createCompanyDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findAllCompany(): Promise<apiResponse<Company[]>> {
        return this.CompanyService.findAll();
    }

    @Get(':cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findOneCompany(@Param('cmpy') cmpy: string): Promise<apiResponse<Company | null>> {
        const Company = await this.CompanyService.findOne(cmpy);
        if (!Company) {
            throw new NotFoundException(`Compañia ${cmpy} no Existe`);
        }
        return Company;
    }

    @Put(':cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async updateCompany(@Param('cmpy') cmpy: string, @Body() updateCompanyDto: UpdateCompanyDto): Promise<apiResponse<Company>> {
        return this.CompanyService.update(cmpy, updateCompanyDto);
    }

    @Delete(':cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async removeCompany(@Param('cmpy') cmpy: string): Promise<apiResponse> {
        return this.CompanyService.remove(cmpy);
    }
}
