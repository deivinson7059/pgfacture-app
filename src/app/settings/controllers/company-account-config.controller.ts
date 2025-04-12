import { Controller, Get, Post, Body, Param, Put, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApplyDecorators, CheckCmpy } from '@common/decorators';
import { ParamSource } from '@common/enums';
import { apiResponse } from '@common/interfaces';

import { CompanyAccountConfig } from '../entities';
import { CompanyAccountConfigService } from '../services/company-account-config.service';
import { UpdateCompanyAccountConfigDto } from '../dto';

@Controller('settings/company-account-config')
@UseInterceptors(ClassSerializerInterceptor)
export class CompanyAccountConfigController {
    constructor(
        private readonly accountConfigService: CompanyAccountConfigService,
    ) { }

    @Put(':cmpy/:level')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async updateAccountConfig(
        @Param('cmpy') cmpy: string,
        @Param('level') level: number,
        @Body() updateDto: UpdateCompanyAccountConfigDto
    ): Promise<apiResponse<CompanyAccountConfig>> {
        // Asegurarse de que el cmpy en el DTO coincida con el de los parámetros
        updateDto.cmpy = cmpy;
        return this.accountConfigService.update(level, updateDto);
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
        // Asegurarse de que todos los configs tengan el cmpy correcto
        configs.forEach(config => {
            config.cmpy = cmpy;
        });
        return this.accountConfigService.updateBulk(cmpy, configs);
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

    @Get(':cmpy/:level')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findOneAccountConfig(
        @Param('cmpy') cmpy: string,
        @Param('level') level: number
    ): Promise<apiResponse<CompanyAccountConfig>> {
        return this.accountConfigService.findOne(cmpy, level);
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