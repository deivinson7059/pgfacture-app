import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { apiResponse } from "src/app/common/interfaces/common.interface";
import { CreateCompanyDto, UpdateCompanyDto } from "../dto";
import { Company, CompanyAccountConfig } from "../entities";
import { DEFAULT_ACCOUNT_VALUES } from "@common/utils/defaultUtils";




@Injectable()
export class CompanyService {
    constructor(
        @InjectRepository(Company)
        private readonly CompanyRepository: Repository<Company>,
        @InjectRepository(CompanyAccountConfig)
        private readonly CompanyAccountConfigRepository: Repository<CompanyAccountConfig>,
        private dataSource: DataSource
    ) { }

    async create(companyData: CreateCompanyDto): Promise<apiResponse<Company>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Obtener el máximo ID actual
            const maxResult = await queryRunner.manager
                .createQueryBuilder(Company, 'Company')
                .select('COALESCE(MAX(Company.cmpy_n_id), 0)', 'max')
                .getRawOne();

            let nextId = Number(maxResult.max) + 1;
            let nextCmpyId = String(nextId).padStart(2, '0');

            // Si el usuario proporcionó un ID de compañía específico, lo usamos en lugar del generado
            const cmpyId = companyData.cmpy || nextCmpyId;

            const existingCompany: boolean = await this.verifyCompanyIdExists(cmpyId);
            // Verificar si la compañia existe
            if (existingCompany) throw new ConflictException("La compañia ya existe");

            // Crear la nueva compañía con el ID verificado
            const newCompany = this.CompanyRepository.create({
                cmpy_n_id: nextId,
                cmpy_id: cmpyId,
                cmpy_type_document_identification_id: companyData.type_document_identification_id,
                cmpy_type_document_identification: companyData.type_document_identification,
                cmpy_document_identification: companyData.document_identification,
                cmpy_dv: companyData.dv,
                cmpy_business_name: companyData.business_name,
                cmpy_trading_name: companyData.trading_name,
                cmpy_trading_type: companyData.trading_type || 'none',
                cmpy_rep_id: companyData.rep_id,
                cmpy_type_organization_id: companyData.type_organization_id,
                cmpy_organization: companyData.organization,
                cmpy_type_regime_id: companyData.type_regime_id,
                cmpy_regime: companyData.regime,
                cmpy_type_liability_id: companyData.type_liability_id,
                cmpy_liability: companyData.liability,
                cmpy_merchant_registration: companyData.merchant_registration,
                cmpy_dep_id: companyData.dep_id,
                cmpy_dep: companyData.dep,
                cmpy_municipality_id: companyData.municipality_id,
                cmpy_municipality: companyData.municipality,
                cmpy_dir: companyData.dir,
                cmpy_tel: companyData.tel,
                cmpy_email: companyData.email,
                cmpy_letter: companyData.letter,
                cmpy_pln_start_date: companyData.pln_start_date,
                cmpy_pln_end_date: companyData.pln_end_date
            });

            // Guardar la nueva compañía
            const savedCompany = await queryRunner.manager.save(newCompany);

            // Inicializar las cuentas contables predeterminadas
            await this.initializeAccountConfig(queryRunner, cmpyId);

            await queryRunner.commitTransaction();

            return {
                message: "Compañia Creada correctamente!..",
                data: savedCompany
            };

        } catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof ConflictException) {
                throw err;
            }
            throw new ConflictException('Error al crear la compañía: ' + err.message);
        } finally {
            await queryRunner.release();
        }
    }

    // Método para inicializar las configuraciones de cuentas contables
    private async initializeAccountConfig(queryRunner: any, cmpy: string): Promise<void> {
        // Crear las configuraciones para cada nivel definido en DEFAULT_ACCOUNT_VALUES
        for (const levelStr in DEFAULT_ACCOUNT_VALUES) {
            const level = parseInt(levelStr);
            const defaultValues = DEFAULT_ACCOUNT_VALUES[level];

            const newConfig = queryRunner.manager.create(CompanyAccountConfig, {
                acc_cmpy: cmpy,
                acc_level: level,
                acc_number: defaultValues.number,
                acc_description: defaultValues.description,
                acc_modules: defaultValues.modules,
                acc_type: defaultValues.type
            });

            await queryRunner.manager.save(newConfig);
        }
    }

    async verifyCompanyIdExists(cmpy: string): Promise<boolean> {
        const company = await this.CompanyRepository.findOne({
            where: { cmpy_id: cmpy }
        });
        return !!company;
    }

    async findAll(): Promise<apiResponse<Company[]>> {
        return {
            message: "Listado de Compañias",
            data: await this.CompanyRepository.find()
        }
    }

    async findOne(cmpy: string): Promise<apiResponse<Company | null>> {
        const company = await this.CompanyRepository.findOne({
            where: { cmpy_id: cmpy }
        });

        if (!company) {
            throw new NotFoundException(`Compañia ${cmpy} no Existe`);
        }

        return {
            message: "Infomacion De la Compañia",
            data: company
        }
    }

    async update(cmpy: string, updateCompanyDto: UpdateCompanyDto): Promise<apiResponse<Company>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const company = await this.CompanyRepository.preload({
                cmpy_id: cmpy,
                ...updateCompanyDto,
            });

            if (!company) {
                throw new NotFoundException(`Compañia ${cmpy} no Existe`);
            }

            // Guardar la compañía actualizada
            const updatedCompany = await queryRunner.manager.save(company);

            // Verificar si existen las cuentas contables para esta compañía
            const existingConfigs = await queryRunner.manager.find(CompanyAccountConfig, {
                where: { acc_cmpy: cmpy }
            });

            // Si no existen cuentas contables, las inicializamos
            if (existingConfigs.length === 0) {
                await this.initializeAccountConfig(queryRunner, cmpy);
            }

            await queryRunner.commitTransaction();

            return {
                message: "Compañia Actualizada correctamente!..",
                data: updatedCompany
            };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof NotFoundException) {
                throw err;
            }
            throw new ConflictException('Error al actualizar la compañía: ' + err.message);
        } finally {
            await queryRunner.release();
        }
    }

    async remove(cmpy: string): Promise<apiResponse> {
        // Primero verificar que exista la compañía
        const company = await this.CompanyRepository.findOne({
            where: { cmpy_id: cmpy }
        });

        if (!company) {
            throw new NotFoundException(`Compañia ${cmpy} no Existe`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Eliminar primero las configuraciones de cuentas asociadas
            await queryRunner.manager.delete(CompanyAccountConfig, { acc_cmpy: cmpy });

            // Luego eliminar la compañía
            await queryRunner.manager.delete(Company, { cmpy_id: cmpy });

            await queryRunner.commitTransaction();

            return {
                message: "Compañia Eliminada correctamente!.."
            };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new ConflictException('Error al eliminar la compañía: ' + err.message);
        } finally {
            await queryRunner.release();
        }
    }
}