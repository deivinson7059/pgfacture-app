import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { apiResponse } from "src/app/common/interfaces/common.interface";
import { CreateCustomerDto, UpdateCustomerDto } from "../dto";
import { Customer } from "../entities/customer.entity";

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(Customer)
        private readonly CustomerRepository: Repository<Customer>,
        private dataSource: DataSource
    ) { }

    async create(createCustomerDto: CreateCustomerDto): Promise<apiResponse<Customer>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si el Tercero ya existe por compañía e identificación
            const existingCustomer = await this.CustomerRepository.findOne({
                where: {
                    cust_cmpy: createCustomerDto.cmpy,
                    cust_identification_number: createCustomerDto.identification_number
                }
            });

            if (existingCustomer) {
                throw new ConflictException(`El Tercero con identificación ${createCustomerDto.identification_number} ya existe para esta compañía`);
            }

            // Obtener el máximo ID actual para esta compañía
            const maxResult = await queryRunner.manager
                .createQueryBuilder(Customer, 'customer')
                .where('customer.cust_cmpy = :cmpy', { cmpy: createCustomerDto.cmpy })
                .select('COALESCE(MAX(customer.cust_id), 0)', 'max')
                .getRawOne();

            const nextId = Number(maxResult.max) + 1;

            // Crear el nuevo Tercero
            const newCustomer = this.CustomerRepository.create({
                cust_id: nextId,
                cust_cmpy: createCustomerDto.cmpy,
                cust_active: createCustomerDto.active || 'Y',
                cust_identification_number: createCustomerDto.identification_number,
                cust_dv: createCustomerDto.dv,
                cust_type_document_identification_id: createCustomerDto.type_document_identification_id,
                cust_type_document_identification: createCustomerDto.type_document_identification,
                cust_type_organization_id: createCustomerDto.type_organization_id,
                cust_type_organization: createCustomerDto.type_organization,
                cust_type_regime_id: createCustomerDto.type_regime_id,
                cust_type_regime: createCustomerDto.type_regime,
                cust_type_liability_id: createCustomerDto.type_liability_id,
                cust_type_liability: createCustomerDto.type_liability,
                cust_name: createCustomerDto.name,
                cust_given_names: createCustomerDto.given_names,
                cust_family_names: createCustomerDto.family_names,
                cust_contact_name: createCustomerDto.contact_name,
                cust_adinfo: createCustomerDto.additional_info,
                cust_email: createCustomerDto.email,
                cust_address: createCustomerDto.address,
                cust_municipality_id: createCustomerDto.municipality_id,
                cust_municipality: createCustomerDto.municipality,
                cust_dep_id: createCustomerDto.dep_id,
                cust_dep: createCustomerDto.dep,
                cust_country_id: createCustomerDto.country_id,
                cust_country: createCustomerDto.country,
                cust_phone: createCustomerDto.phone,
                cust_mobile: createCustomerDto.mobile,
                cust_pass: createCustomerDto.password,
                cust_newpass: createCustomerDto.new_password,
                cust_auth: createCustomerDto.auth,
                created_at: new Date(),
                updated_at: new Date()
            });

            // Guardar el nuevo Tercero
            const savedCustomer = await queryRunner.manager.save(newCustomer);
            await queryRunner.commitTransaction();

            return {
                message: "Tercero creado correctamente!",
                data: savedCustomer
            };

        } catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof ConflictException) {
                throw err;
            }
            throw new ConflictException('Error al crear el Tercero: ' + err.message);
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(cmpy: string): Promise<apiResponse<Customer[]>> {
        const customers = await this.CustomerRepository.find({
            where: { cust_cmpy: cmpy }
        });

        return {
            message: "Listado de Terceros",
            data: customers
        };
    }

    async findOne(cmpy: string, identification: string): Promise<apiResponse<Customer>> {
        const customer = await this.CustomerRepository.findOne({
            where: {
                cust_cmpy: cmpy,
                cust_identification_number: identification
            }
        });

        if (!customer) {
            throw new NotFoundException(`Tercero con identificación ${identification} no existe`);
        }

        return {
            message: "Información del Tercero",
            data: customer
        };
    }

    async update(cmpy: string, identification: string, updateCustomerDto: UpdateCustomerDto): Promise<apiResponse<Customer>> {
        const customer = await this.CustomerRepository.findOne({
            where: {
                cust_cmpy: cmpy,
                cust_identification_number: identification
            }
        });

        if (!customer) {
            throw new NotFoundException(`Tercero con identificación ${identification} no existe`);
        }

        // Actualizar solo los campos proporcionados
        const updatedCustomer = this.CustomerRepository.create({
            ...customer,
            ...Object.entries(updateCustomerDto).reduce((acc, [key, value]) => {
                // Convertir las claves del DTO a las claves de la entidad
                const entityKey = `cust_${key}`;
                acc[entityKey] = value;
                return acc;
            }, {}),
            updated_at: new Date()
        });

        const savedCustomer = await this.CustomerRepository.save(updatedCustomer);

        return {
            message: "Tercero actualizado correctamente!",
            data: savedCustomer
        };
    }

    async remove(cmpy: string, identification: string): Promise<apiResponse> {
        const customer = await this.CustomerRepository.findOne({
            where: {
                cust_cmpy: cmpy,
                cust_identification_number: identification
            }
        });

        if (!customer) {
            throw new NotFoundException(`Tercero con identificación ${identification} no existe`);
        }

        await this.CustomerRepository.remove(customer);

        return {
            message: "Tercero eliminado correctamente!"
        };
    }
}