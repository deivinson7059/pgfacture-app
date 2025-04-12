import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApplyDecorators, CheckCmpy } from '@common/decorators';
import { ParamSource } from '@common/enums';
import { apiResponse } from '@common/interfaces';

import { CompanyAccountConfig } from '../entities';
import { CompanyAccountConfigService } from '../services/company-account-config.service';
import { CreateCompanyAccountConfigDto, UpdateCompanyAccountConfigDto } from '../dto';

@Controller('settings/company-account-config')
@UseInterceptors(ClassSerializerInterceptor)
export class CompanyAccountConfigController {
    constructor(
        private readonly accountConfigService: CompanyAccountConfigService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async createAccountConfig(@Body() createDto: CreateCompanyAccountConfigDto): Promise<apiResponse<CompanyAccountConfig>> {
        return this.accountConfigService.create(createDto);
    }

    @Post('bulk')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async createBulkAccountConfig(@Body() configs: CreateCompanyAccountConfigDto[]): Promise<apiResponse<{ success: boolean }>> {
        return this.accountConfigService.createBulk(configs);
    }

    @Get(':cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findAllAccountConfigs(@Param('cmpy') cmpy: string): Promise<apiResponse<CompanyAccountConfig[]>> {
        return this.accountConfigService.findAll(cmpy);
    }

    @Get('single/:id')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findOneAccountConfig(@Param('id') id: number): Promise<apiResponse<CompanyAccountConfig>> {
        return this.accountConfigService.findOne(id);
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async updateAccountConfig(
        @Param('id') id: number,
        @Body() updateDto: UpdateCompanyAccountConfigDto
    ): Promise<apiResponse<CompanyAccountConfig>> {
        return this.accountConfigService.update(id, updateDto);
    }

    @Put('bulk/:cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async updateBulkAccountConfig(
        @Param('cmpy') cmpy: string,
        @Body() configs: UpdateCompanyAccountConfigDto[]
    ): Promise<apiResponse<{ success: boolean }>> {
        return this.accountConfigService.updateBulk(cmpy, configs);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async removeAccountConfig(@Param('id') id: number): Promise<apiResponse<{ success: boolean }>> {
        return this.accountConfigService.remove(id);
    }

    @Post('init/:cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async initDefaultAccounts(@Param('cmpy') cmpy: string): Promise<apiResponse<{ success: boolean }>> {
        return this.accountConfigService.initDefaultAccounts(cmpy);
    }
}