// src/app/settings/services/company-payroll-config.service.ts
import { ConflictException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";

import { apiResponse } from "@common/interfaces";
import { CreateCompanyPayrollConfigDto, UpdateCompanyPayrollConfigDto } from "../dto";
import { CompanyPayrollConfig } from "../entities";
import { DEFAULT_PAYROLL_VALUES } from "@common/utils/defaultUtils";

@Injectable()
export class CompanyPayrollConfigService {
    constructor(
        @InjectRepository(CompanyPayrollConfig)
        private readonly companyPayrollConfigRepository: Repository<CompanyPayrollConfig>,
        private dataSource: DataSource
    ) { }

    async update(cmpy: string, concept: string, updateDto: UpdateCompanyPayrollConfigDto): Promise<apiResponse<CompanyPayrollConfig>> {
        // Buscar si existe la configuración
        const config = await this.companyPayrollConfigRepository.findOne({
            where: {
                pay_cmpy: cmpy,
                pay_concept: concept
            }
        });

        if (!config) {
            // Si no existe, verificamos si está en los valores por defecto
            const defaultConfig = DEFAULT_PAYROLL_VALUES.find(p => p.concept === concept);

            if (!defaultConfig) {
                throw new BadRequestException(`El concepto ${concept} no es válido`);
            }

            // Si existe en los valores por defecto, creamos una nueva configuración
            // Creamos la instancia directamente en lugar de usar create()
            const newConfig = new CompanyPayrollConfig();
            newConfig.pay_cmpy = cmpy;
            newConfig.pay_concept = concept;
            newConfig.pay_db_account = updateDto.db_account || defaultConfig.db_account;
            newConfig.pay_db_description = updateDto.db_description || defaultConfig.db_description;
            newConfig.pay_cr_account = updateDto.cr_account! || defaultConfig.cr_account!;
            newConfig.pay_cr_description = updateDto.cr_description! || defaultConfig.cr_description!;
            newConfig.pay_type = updateDto.type || defaultConfig.type;
            newConfig.pay_third_type = updateDto.third_type || defaultConfig.third_type;

            const savedConfig = await this.companyPayrollConfigRepository.save(newConfig);

            return {
                message: "Configuración de nómina creada correctamente",
                data: savedConfig
            };
        }

        // Actualizar campos, usando valores existentes si los nuevos son nulos
        config.pay_db_account = updateDto.db_account || config.pay_db_account;
        config.pay_db_description = updateDto.db_description || config.pay_db_description;
        config.pay_cr_account = updateDto.cr_account || config.pay_cr_account;
        config.pay_cr_description = updateDto.cr_description || config.pay_cr_description;
        config.pay_type = updateDto.type || config.pay_type;
        config.pay_third_type = updateDto.third_type || config.pay_third_type;

        const updatedConfig = await this.companyPayrollConfigRepository.save(config);

        return {
            message: "Configuración de nómina actualizada correctamente",
            data: updatedConfig
        };
    }

    async updateBulk(cmpy: string, configs: UpdateCompanyPayrollConfigDto[]): Promise<apiResponse<{ success: boolean }>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const config of configs) {
                if (!config.concept) {
                    throw new BadRequestException("El concepto es requerido para cada configuración");
                }

                // Verificar si el concepto existe en los valores por defecto
                const defaultConfig = DEFAULT_PAYROLL_VALUES.find(p => p.concept === config.concept);

                if (!defaultConfig) {
                    throw new BadRequestException(`El concepto ${config.concept} no es válido`);
                }

                const existingConfig = await queryRunner.manager.findOne(CompanyPayrollConfig, {
                    where: {
                        pay_cmpy: cmpy,
                        pay_concept: config.concept
                    }
                });

                if (existingConfig) {
                    // Actualizar configuración existente
                    existingConfig.pay_db_account = config.db_account || existingConfig.pay_db_account;
                    existingConfig.pay_db_description = config.db_description || existingConfig.pay_db_description;
                    existingConfig.pay_cr_account = config.cr_account || existingConfig.pay_cr_account;
                    existingConfig.pay_cr_description = config.cr_description || existingConfig.pay_cr_description;
                    existingConfig.pay_type = config.type || existingConfig.pay_type;
                    existingConfig.pay_third_type = config.third_type || existingConfig.pay_third_type;

                    await queryRunner.manager.save(existingConfig);
                } else {
                    // Crear nueva configuración
                    const newConfig = new CompanyPayrollConfig();
                    newConfig.pay_cmpy = cmpy;
                    newConfig.pay_concept = config.concept;
                    newConfig.pay_db_account = config.db_account || defaultConfig.db_account;
                    newConfig.pay_db_description = config.db_description || defaultConfig.db_description;
                    newConfig.pay_cr_account = config.cr_account! || defaultConfig.cr_account!;
                    newConfig.pay_cr_description = config.cr_description! || defaultConfig.cr_description!;
                    newConfig.pay_type = config.type || defaultConfig.type;
                    newConfig.pay_third_type = config.third_type || defaultConfig.third_type;

                    await queryRunner.manager.save(newConfig);
                }
            }

            await queryRunner.commitTransaction();

            return {
                message: "Configuraciones de nómina actualizadas correctamente",
                data: { success: true }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new ConflictException('Error al actualizar las configuraciones de nómina: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(cmpy: string): Promise<apiResponse<CompanyPayrollConfig[]>> {
        const configs = await this.companyPayrollConfigRepository.find({
            where: { pay_cmpy: cmpy },
            order: { pay_concept: 'ASC' }
        });

        return {
            message: "Listado de configuraciones de nómina",
            data: configs
        };
    }

    async findOne(cmpy: string, concept: string): Promise<apiResponse<CompanyPayrollConfig>> {
        const defaultConfig = DEFAULT_PAYROLL_VALUES.find(p => p.concept === concept);

        if (!defaultConfig) {
            throw new BadRequestException(`El concepto ${concept} no es válido`);
        }

        const config = await this.companyPayrollConfigRepository.findOne({
            where: {
                pay_cmpy: cmpy,
                pay_concept: concept
            }
        });

        if (!config) {
            // Si no existe, retornamos los valores predeterminados
            // Creamos un objeto de tipo CompanyPayrollConfig usando construcción directa
            const defaultPayrollConfig = new CompanyPayrollConfig();
            defaultPayrollConfig.pay_cmpy = cmpy;
            defaultPayrollConfig.pay_concept = concept;
            defaultPayrollConfig.pay_db_account = defaultConfig.db_account;
            defaultPayrollConfig.pay_db_description = defaultConfig.db_description;
            defaultPayrollConfig.pay_cr_account = defaultConfig.cr_account!;
            defaultPayrollConfig.pay_cr_description = defaultConfig.cr_description!;
            defaultPayrollConfig.pay_type = defaultConfig.type;
            defaultPayrollConfig.pay_third_type = defaultConfig.third_type;

            return {
                message: "Configuración de nómina (valores predeterminados)",
                data: defaultPayrollConfig
            };
        }

        return {
            message: "Configuración de nómina",
            data: config
        };
    }

    async initDefaultPayrollAccounts(cmpy: string): Promise<apiResponse<{ success: boolean }>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si ya existen configuraciones para esta compañía
            const existingConfigs = await queryRunner.manager.find(CompanyPayrollConfig, {
                where: { pay_cmpy: cmpy }
            });

            // Si ya existen algunas configuraciones, solo creamos las que faltan
            const existingConcepts = existingConfigs.map(conf => conf.pay_concept);
            const allConcepts = DEFAULT_PAYROLL_VALUES.map(val => val.concept);

            // Determinamos qué conceptos faltan por crear
            const missingConcepts = allConcepts.filter(concept => !existingConcepts.includes(concept));

            // Crear las configuraciones faltantes
            for (const concept of missingConcepts) {
                const defaultValue = DEFAULT_PAYROLL_VALUES.find(val => val.concept === concept);

                if (defaultValue) {
                    const newConfig = new CompanyPayrollConfig();
                    newConfig.pay_cmpy = cmpy;
                    newConfig.pay_concept = concept;
                    newConfig.pay_db_account = defaultValue.db_account;
                    newConfig.pay_db_description = defaultValue.db_description;
                    newConfig.pay_cr_account = defaultValue.cr_account!;
                    newConfig.pay_cr_description = defaultValue.cr_description!;
                    newConfig.pay_type = defaultValue.type;
                    newConfig.pay_third_type = defaultValue.third_type;

                    await queryRunner.manager.save(newConfig);
                }
            }

            await queryRunner.commitTransaction();

            return {
                message: existingConfigs.length > 0
                    ? "Configuraciones de nómina faltantes creadas correctamente"
                    : "Configuraciones de nómina predeterminadas creadas correctamente",
                data: { success: true }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new ConflictException('Error al crear las configuraciones de nómina predeterminadas: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }
}