import { Controller, Get, Post, Body, Param, Delete, NotFoundException, Put, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { apiResponse } from '../../common/interfaces/common.interface';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto';
import { Company } from '../entities';
import { CompanyService } from '../services/company.service';

@Controller('settings/company')
@UseInterceptors(ClassSerializerInterceptor)
export class CompanyController {
    constructor(
        private readonly CompanyService: CompanyService,
    ) { }

    /**
    * Compañias
    **/
    @Post()
    async createCompany(@Body() createCompanyDto: CreateCompanyDto): Promise<apiResponse<Company>> {
        return this.CompanyService.create(createCompanyDto);
    }

    @Get()
    async findAllCompany(): Promise<apiResponse<Company[]>> {
        return this.CompanyService.findAll();
    }

    @Get(':cmpy')
    async findOneCompany(@Param('cmpy') cmpy: string): Promise<apiResponse<Company | null>> {
        const Company = await this.CompanyService.findOne(cmpy);
        if (!Company) {
            throw new NotFoundException(`Compañia ${cmpy} no Existe`);
        }
        return Company;
    }

    @Put(':cmpy')
    async updateCompany(@Param('cmpy') cmpy: string, @Body() updateCompanyDto: UpdateCompanyDto): Promise<apiResponse<Company>> {
        return this.CompanyService.update(cmpy, updateCompanyDto);
    }

    @Delete(':cmpy')
    async removeCompany(@Param('cmpy') cmpy: string): Promise<apiResponse> {
        return this.CompanyService.remove(cmpy);
    }
    /**
     * Fin Compañias
     **/

}
