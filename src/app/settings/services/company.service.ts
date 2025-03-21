import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { apiResponse } from "src/app/common/interfaces/common.interface";
import { CreateCompanyDto, UpdateCompanyDto } from "../dto";
import { Company } from "../entities";

@Injectable()
export class CompanyService {
    constructor(
        @InjectRepository(Company)
        private readonly CompanyRepository: Repository<Company>,
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

            const existingCompany: boolean = await this.verifyCompanyIdExists(companyData.cmpy!);
            // Verificar si la compañia existe
            if (existingCompany) throw new ConflictException("La compañia ya existe");

            // Crear la nueva compañía con el ID verificado
            const newCompany = this.CompanyRepository.create({
                cmpy_n_id: nextId,
                cmpy_id: nextCmpyId,
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
        console.log(cmpy);
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
        const Company = await this.CompanyRepository.preload({
            cmpy_id: cmpy,
            ...updateCompanyDto,
        });
        if (!Company) {
            throw new NotFoundException(`Compañia ${cmpy} no Existe`);
        }

        return {
            message: "Compañia Actualizada correctamente!..",
            data: await this.CompanyRepository.save(Company)
        };
    }

    async remove(cmpy: string): Promise<apiResponse> {
        const result = await this.CompanyRepository.delete(cmpy);
        if (result.affected === 0) {
            throw new NotFoundException(`Compañia ${cmpy} no Existe`);
        }

        return {
            message: "Compañia Eliminada correctamente!.."
        };


    }

}