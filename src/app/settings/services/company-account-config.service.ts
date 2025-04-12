import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";

import { apiResponse } from "src/app/common/interfaces/common.interface";
import { CreateCompanyAccountConfigDto, UpdateCompanyAccountConfigDto } from "../dto";
import { CompanyAccountConfig } from "../entities";

@Injectable()
export class CompanyAccountConfigService {
    constructor(
        @InjectRepository(CompanyAccountConfig)
        private readonly companyAccountConfigRepository: Repository<CompanyAccountConfig>,
        private dataSource: DataSource
    ) { }

    async create(createDto: CreateCompanyAccountConfigDto): Promise<apiResponse<CompanyAccountConfig>> {
        try {
            // Verificar si ya existe una configuración con el mismo orden para esta compañía
            const existingConfig = await this.companyAccountConfigRepository.findOne({
                where: {
                    acc_cmpy: createDto.cmpy,
                    acc_order: createDto.order
                }
            });

            if (existingConfig) {
                throw new ConflictException(`Ya existe una configuración de cuenta con el orden ${createDto.order} para la compañía ${createDto.cmpy}`);
            }

            // Crear nueva configuración
            const newConfig = this.companyAccountConfigRepository.create({
                acc_cmpy: createDto.cmpy,
                acc_order: createDto.order,
                acc_number: createDto.account_number,
                acc_description: createDto.description,
                acc_modules: createDto.modules || '',
                acc_type: createDto.type
            });

            const savedConfig = await this.companyAccountConfigRepository.save(newConfig);

            return {
                message: "Configuración de cuenta creada correctamente",
                data: savedConfig
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new ConflictException('Error al crear la configuración de cuenta: ' + error.message);
        }
    }

    async createBulk(configs: CreateCompanyAccountConfigDto[]): Promise<apiResponse<{ success: boolean }>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const config of configs) {
                const newConfig = queryRunner.manager.create(CompanyAccountConfig, {
                    acc_cmpy: config.cmpy,
                    acc_order: config.order,
                    acc_number: config.account_number,
                    acc_description: config.description,
                    acc_modules: config.modules || '',
                    acc_type: config.type
                });

                await queryRunner.manager.save(newConfig);
            }

            await queryRunner.commitTransaction();

            return {
                message: "Configuraciones de cuentas creadas correctamente",
                data: { success: true }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new ConflictException('Error al crear las configuraciones de cuentas: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(cmpy: string): Promise<apiResponse<CompanyAccountConfig[]>> {
        const configs = await this.companyAccountConfigRepository.find({
            where: { acc_cmpy: cmpy },
            order: { acc_order: 'ASC' }
        });

        return {
            message: "Listado de configuraciones de cuentas",
            data: configs
        };
    }

    async findOne(id: number): Promise<apiResponse<CompanyAccountConfig>> {
        const config = await this.companyAccountConfigRepository.findOne({
            where: { acc_order: id }
        });

        if (!config) {
            throw new NotFoundException(`Configuración de cuenta con ID ${id} no encontrada`);
        }

        return {
            message: "Configuración de cuenta",
            data: config
        };
    }

    async update(id: number, updateDto: UpdateCompanyAccountConfigDto): Promise<apiResponse<CompanyAccountConfig>> {
        const config = await this.companyAccountConfigRepository.findOne({
            where: { acc_order: id }
        });

        if (!config) {
            throw new NotFoundException(`Configuración de cuenta con ID ${id} no encontrada`);
        }

        // Actualizar campos
        Object.assign(config, {
            acc_number: updateDto.account_number,
            acc_description: updateDto.description,
            acc_modules: updateDto.modules,
            acc_type: updateDto.type
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
                const existingConfig = await queryRunner.manager.findOne(CompanyAccountConfig, {
                    where: {
                        acc_cmpy: cmpy,
                        acc_order: config.order
                    }
                });

                if (existingConfig) {
                    // Actualizar configuración existente
                    Object.assign(existingConfig, {
                        acc_number: config.account_number,
                        acc_description: config.description,
                        acc_modules: config.modules,
                        acc_type: config.type
                    });

                    await queryRunner.manager.save(existingConfig);
                } else {
                    // Crear nueva configuración
                    const newConfig = queryRunner.manager.create(CompanyAccountConfig, {
                        acc_cmpy: cmpy,
                        acc_order: config.order,
                        acc_number: config.account_number,
                        acc_description: config.description,
                        acc_modules: config.modules || '',
                        acc_type: config.type
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
            throw new ConflictException('Error al actualizar las configuraciones de cuentas: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async remove(id: number): Promise<apiResponse<{ success: boolean }>> {
        const result = await this.companyAccountConfigRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Configuración de cuenta con ID ${id} no encontrada`);
        }

        return {
            message: "Configuración de cuenta eliminada correctamente",
            data: { success: true }
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

            if (existingConfigs.length > 0) {
                throw new ConflictException(`Ya existen configuraciones de cuentas para la compañía ${cmpy}`);
            }

            // Definir las 27 cuentas predeterminadas
            const defaultAccounts = [
                { order: 1, number: '41352805', description: 'Cuenta Ingresos Gravados al 19% (CR)', modules: 'Facturas de venta, POS', type: 'CR' },
                { order: 2, number: '41352815', description: 'Cuenta Ingresos Gravados al 5% (CR)', modules: 'Facturas de venta, POS', type: 'CR' },
                { order: 3, number: '41352810', description: 'Cuenta Ingresos No Gravados (CR)', modules: 'Facturas de venta, POS', type: 'CR' },
                { order: 4, number: '613528', description: 'Cuenta costos de venta (DB)', modules: 'Facturas de venta, POS', type: 'DB' },
                { order: 5, number: '14350105', description: 'Mercancias no fabricadas vendidas - en operaciones gravadas. (CR)', modules: 'Facturas de venta, POS, Remisión', type: 'CR' },
                { order: 6, number: '14350110', description: 'Mercancias no fabricadas vendidas- en operaciones no gravadas. (CR)', modules: 'Facturas de venta, POS, Remisión', type: 'CR' },
                { order: 7, number: '14300105', description: 'Mercancias fabricadas vendidas - en operaciones gravadas. (CR)', modules: 'Facturas de venta, POS, Remisión', type: 'CR' },
                { order: 8, number: '14300110', description: 'Mercancias fabricadas vendidas - en operaciones no gravadas. (CR)', modules: 'Facturas de venta, POS, Remisión', type: 'CR' },
                { order: 9, number: '143005', description: 'Mercancias fabricadas - transformadas desde materia prima. (DB)', modules: 'Transformación de inventarios', type: 'DB' },
                { order: 10, number: '146510', description: 'Mercancias en traslado entre bodegas - salida. (DB)', modules: 'Traslados de inventarios', type: 'DB' },
                { order: 11, number: '14350205', description: 'Mercancias no fabricadas compradas - en operaciones gravadas. (DB)', modules: 'Factura de proveedor', type: 'DB' },
                { order: 12, number: '14350210', description: 'Mercancias no fabricadas compradas- en operaciones no gravadas. (DB)', modules: 'Factura de proveedor', type: 'DB' },
                { order: 13, number: '14350215', description: 'Mercancias no fabricadas compradas- en importaciones. (DB)', modules: 'Liquidación Importaciones', type: 'DB' },
                { order: 14, number: '140502', description: 'Materia prima transformada a Mercancias fabricadas. (CR)', modules: 'Transformación de inventarios', type: 'CR' },
                { order: 15, number: '140501', description: 'Materias primas compradas. (DB)', modules: 'Factura de proveedor', type: 'DB' },
                { order: 16, number: '147001', description: 'Mercancias remisionadas - salida. (CR)', modules: 'Remisiones', type: 'CR' },
                { order: 17, number: '147002', description: 'Mercancias remisionadas - convertido a factura. (DB)', modules: 'Remisiones', type: 'DB' },
                { order: 18, number: '14650505', description: 'Inventario en transito de importación (DB/CR)', modules: 'Importaciones', type: 'DB/CR' },
                { order: 19, number: '14650506', description: 'Ajsutes de inventarios', modules: 'Ajuste de inventarios', type: 'DB/CR' },
                { order: 20, number: '14650507', description: 'Debito en factura cerrada sin pago', modules: 'Facturación', type: 'DB' },
                { order: 21, number: '14650508', description: 'Credito en descuento sobre factura de proveedor', modules: 'Facturas Proveedor', type: 'CR' },
                { order: 22, number: '14650509', description: 'Cuenta por cobrar en remisiones (cartera) (DB)', modules: 'Remisiones', type: 'DB' },
                { order: 23, number: '14650510', description: 'Inventarios en remisiones (CR)', modules: 'Remisiones', type: 'CR' },
                { order: 24, number: '14650511', description: 'Ingreso en remisiones (CR)', modules: 'Remisiones', type: 'CR' },
                { order: 25, number: '14650512', description: 'Descuento Financiero en factura de venta (DB)', modules: 'Facturación', type: 'DB' },
                { order: 26, number: '14650513', description: 'IVA en devoluciones al 5% (DB)', modules: 'Facturación', type: 'DB' },
                { order: 27, number: '14650514', description: 'IVA en devoluciones al 19% (DB)', modules: 'Facturación', type: 'DB' },
            ];

            // Crear las configuraciones
            for (const account of defaultAccounts) {
                const newConfig = queryRunner.manager.create(CompanyAccountConfig, {
                    acc_cmpy: cmpy,
                    acc_order: account.order,
                    acc_number: account.number,
                    acc_description: account.description,
                    acc_modules: account.modules,
                    acc_type: account.type
                });

                await queryRunner.manager.save(newConfig);
            }

            await queryRunner.commitTransaction();

            return {
                message: "Configuraciones de cuentas predeterminadas creadas correctamente",
                data: { success: true }
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new ConflictException('Error al crear las configuraciones de cuentas predeterminadas: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }
}