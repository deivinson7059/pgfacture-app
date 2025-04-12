// src/app/settings/controllers/company-payroll-config.controller.ts
import { Controller, Get, Post, Body, Param, Put, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApplyDecorators, CheckCmpy } from '@common/decorators';
import { ParamSource } from '@common/enums';
import { apiResponse } from '@common/interfaces';

import { CompanyPayrollConfig } from '../entities';
import { CompanyPayrollConfigService } from '../services/company-payroll-config.service';
import { UpdateCompanyPayrollConfigDto } from '../dto';

@Controller('settings/company-payroll')
@UseInterceptors(ClassSerializerInterceptor)
export class CompanyPayrollConfigController {
    constructor(
        private readonly payrollConfigService: CompanyPayrollConfigService,
    ) { }

    @Put(':cmpy/:concept')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async updatePayrollConfig(
        @Param('cmpy') cmpy: string,
        @Param('concept') concept: string,
        @Body() updateDto: UpdateCompanyPayrollConfigDto
    ): Promise<apiResponse<CompanyPayrollConfig>> {
        // Asegurarse de que el cmpy en el DTO coincida con el de los parámetros
        updateDto.cmpy = cmpy;
        updateDto.concept = concept;
        return this.payrollConfigService.update(cmpy, concept, updateDto);
    }

    @Put('bulk/:cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async updateBulkPayrollConfig(
        @Param('cmpy') cmpy: string,
        @Body() configs: UpdateCompanyPayrollConfigDto[]
    ): Promise<apiResponse<{ success: boolean }>> {
        // Asegurarse de que todos los configs tengan el cmpy correcto
        configs.forEach(config => {
            config.cmpy = cmpy;
        });
        return this.payrollConfigService.updateBulk(cmpy, configs);
    }

    @Get(':cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findAllPayrollConfigs(@Param('cmpy') cmpy: string): Promise<apiResponse<CompanyPayrollConfig[]>> {
        return this.payrollConfigService.findAll(cmpy);
    }

    @Get(':cmpy/:concept')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findOnePayrollConfig(
        @Param('cmpy') cmpy: string,
        @Param('concept') concept: string
    ): Promise<apiResponse<CompanyPayrollConfig>> {
        return this.payrollConfigService.findOne(cmpy, concept);
    }

    @Post('init/:cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async initDefaultPayrollAccounts(@Param('cmpy') cmpy: string): Promise<apiResponse<{ success: boolean }>> {
        return this.payrollConfigService.initDefaultPayrollAccounts(cmpy);
    }
}