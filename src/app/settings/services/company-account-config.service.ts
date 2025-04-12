import { ConflictException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";

import { apiResponse } from "src/app/common/interfaces/common.interface";
import { CreateCompanyAccountConfigDto, UpdateCompanyAccountConfigDto } from "../dto";
import { CompanyAccountConfig } from "../entities";
import { DEFAULT_ACCOUNT_VALUES } from "@common/utils/defaultUtils";

@Injectable()
export class CompanyAccountConfigService {
    constructor(
        @InjectRepository(CompanyAccountConfig)
        private readonly companyAccountConfigRepository: Repository<CompanyAccountConfig>,
        private dataSource: DataSource
    ) { }

    async update(level: number, updateDto: UpdateCompanyAccountConfigDto): Promise<apiResponse<CompanyAccountConfig>> {
        if (!DEFAULT_ACCOUNT_VALUES[level]) {
            throw new BadRequestException(`El nivel ${level} no es válido`);
        }

        // Obtener valores predeterminados para este nivel
        const defaultValues = DEFAULT_ACCOUNT_VALUES[level];

        const config = await this.companyAccountConfigRepository.findOne({
            where: {
                acc_cmpy: updateDto.cmpy,
                acc_level: level
            }
        });

        if (!config) {
            // Si no existe, creamos una nueva configuración
            const newConfig = this.companyAccountConfigRepository.create({
                acc_cmpy: updateDto.cmpy,
                acc_level: level,
                acc_number: updateDto.account_number || defaultValues.number,
                acc_description: updateDto.description || defaultValues.description,
                acc_modules: updateDto.modules || defaultValues.modules,
                acc_type: updateDto.type || defaultValues.type
            });

            const savedConfig = await this.companyAccountConfigRepository.save(newConfig);

            return {
                message: "Configuración de cuenta creada correctamente",
                data: savedConfig
            };
        }

        // Actualizar campos, usando valores existentes si los nuevos son nulos
        Object.assign(config, {
            acc_number: updateDto.account_number || config.acc_number,
            acc_description: updateDto.description || config.acc_description,
            acc_modules: updateDto.modules || config.acc_modules,
            acc_type: updateDto.type || config.acc_type
        });

        const updatedConfig = await this.companyAccountConfigRepository.save(config);

        return {
            message: "Configuración de cuenta actualizada correctamente",
            data: updatedConfig
        };
    }

    async updateBulk(cmpy: string, configs: UpdateCompanyAccountConfigDto[]): Promise<apiResponse<{ success: boolean }>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const config of configs) {
                if (!config.level) {
                    throw new BadRequestException("El nivel es requerido para cada configuración");
                }

                if (!DEFAULT_ACCOUNT_VALUES[config.level]) {
                    throw new BadRequestException(`El nivel ${config.level} no es válido`);
                }

                // Obtener valores predeterminados para este nivel
                const defaultValues = DEFAULT_ACCOUNT_VALUES[config.level];

                const existingConfig = await queryRunner.manager.findOne(CompanyAccountConfig, {
                    where: {
                        acc_cmpy: cmpy,
                        acc_level: config.level
                    }
                });

                if (existingConfig) {
                    // Actualizar configuración existente
                    Object.assign(existingConfig, {
                        acc_number: config.account_number || existingConfig.acc_number,
                        acc_description: config.description || existingConfig.acc_description,
                        acc_modules: config.modules || existingConfig.acc_modules,
                        acc_type: config.type || existingConfig.acc_type
                    });

                    await queryRunner.manager.save(existingConfig);
                } else {
                    // Crear nueva configuración
                    const newConfig = queryRunner.manager.create(CompanyAccountConfig, {
                        acc_cmpy: cmpy,
                        acc_level: config.level,
                        acc_number: config.account_number || defaultValues.number,
                        acc_description: config.description || defaultValues.description,
                        acc_modules: config.modules || defaultValues.modules,
                        acc_type: config.type || defaultValues.type
                    });

                    await queryRunner.manager.save(newConfig);
                }
            }

            await queryRunner.commitTransaction();

            return {
                message: "Configuraciones de cuentas actualizadas correctamente",
                data: { success: true }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new ConflictException('Error al actualizar las configuraciones de cuentas: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(cmpy: string): Promise<apiResponse<CompanyAccountConfig[]>> {
        const configs = await this.companyAccountConfigRepository.find({
            where: { acc_cmpy: cmpy },
            order: { acc_level: 'ASC' }
        });

        return {
            message: "Listado de configuraciones de cuentas",
            data: configs
        };
    }

    async findOne(cmpy: string, level: number): Promise<apiResponse<CompanyAccountConfig>> {
        if (!DEFAULT_ACCOUNT_VALUES[level]) {
            throw new BadRequestException(`El nivel ${level} no es válido`);
        }

        const config = await this.companyAccountConfigRepository.findOne({
            where: {
                acc_cmpy: cmpy,
                acc_level: level
            }
        });

        if (!config) {
            // Si no existe, retornamos los valores predeterminados
            const defaultValues = DEFAULT_ACCOUNT_VALUES[level];

            // Creamos un objeto de tipo CompanyAccountConfig pero no lo guardamos
            const defaultConfig = this.companyAccountConfigRepository.create({
                acc_cmpy: cmpy,
                acc_level: level,
                acc_number: defaultValues.number,
                acc_description: defaultValues.description,
                acc_modules: defaultValues.modules,
                acc_type: defaultValues.type
            });

            return {
                message: "Configuración de cuenta (valores predeterminados)",
                data: defaultConfig
            };
        }

        return {
            message: "Configuración de cuenta",
            data: config
        };
    }

    async initDefaultAccounts(cmpy: string): Promise<apiResponse<{ success: boolean }>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si ya existen configuraciones para esta compañía
            const existingConfigs = await queryRunner.manager.find(CompanyAccountConfig, {
                where: { acc_cmpy: cmpy }
            });

            // Si ya existen algunas configuraciones, solo creamos las que faltan
            const existingLevels = existingConfigs.map(conf => conf.acc_level);
            const allLevels = Object.keys(DEFAULT_ACCOUNT_VALUES).map(key => parseInt(key));

            // Determinamos qué niveles faltan por crear
            const missingLevels = allLevels.filter(level => !existingLevels.includes(level));

            // Crear las configuraciones faltantes
            for (const level of missingLevels) {
                const defaultValue = DEFAULT_ACCOUNT_VALUES[level];

                const newConfig = queryRunner.manager.create(CompanyAccountConfig, {
                    acc_cmpy: cmpy,
                    acc_level: level,
                    acc_number: defaultValue.number,
                    acc_description: defaultValue.description,
                    acc_modules: defaultValue.modules,
                    acc_type: defaultValue.type
                });

                await queryRunner.manager.save(newConfig);
            }

            await queryRunner.commitTransaction();

            return {
                message: existingConfigs.length > 0
                    ? "Configuraciones de cuentas faltantes creadas correctamente"
                    : "Configuraciones de cuentas predeterminadas creadas correctamente",
                data: { success: true }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new ConflictException('Error al crear las configuraciones de cuentas predeterminadas: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }
}