import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { apiResponse } from "src/app/common/interfaces/common.interface";
import { CreateCustomerDto, UpdatePasswordDto } from "../dto";
import { Customer } from "../entities/customer.entity";
import { PasswordCryptoService } from ".";

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(Customer)
        private readonly CustomerRepository: Repository<Customer>,
        private dataSource: DataSource,
        private readonly passwordCryptoService: PasswordCryptoService
    ) { }

    async saveCustomer(customerData: CreateCustomerDto): Promise<apiResponse<Customer>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar si el tercero ya existe
            const existingCustomer = await this.CustomerRepository.findOne({
                where: {
                    cust_cmpy: customerData.cmpy,
                    cust_identification_number: customerData.identification_number
                }
            });

            let savedCustomer: Customer;

            // Genera un hash seguro para la contraseña
            const password = customerData.password || customerData.identification_number;
            const hashedPassword = await this.passwordCryptoService.hashPassword(password);

            if (existingCustomer) {
                // Si existe, actualizar
                const updatedCustomer = this.CustomerRepository.create({
                    ...existingCustomer,
                    cust_active: 'Y', // Siempre activar el tercero al actualizar
                    cust_dv: customerData.dv,
                    cust_type_document_identification_id: customerData.type_document_identification_id,
                    cust_type_document_identification: customerData.type_document_identification,
                    cust_type_organization_id: customerData.type_organization_id,
                    cust_type_organization: customerData.type_organization,
                    cust_type_regime_id: customerData.type_regime_id,
                    cust_type_regime: customerData.type_regime,
                    cust_type_liability_id: customerData.type_liability_id,
                    cust_type_liability: customerData.type_liability,
                    cust_name: customerData.name,
                    cust_contact_name: customerData.contact_name,
                    cust_adinfo: customerData.additional_info,
                    cust_email: customerData.email,
                    cust_address: customerData.address,
                    cust_municipality_id: customerData.municipality_id,
                    cust_municipality: customerData.municipality,
                    cust_dep_id: customerData.dep_id,
                    cust_dep: customerData.dep,
                    cust_country_id: customerData.country_id,
                    cust_country: customerData.country,
                    cust_phone: customerData.phone,
                    cust_pass: hashedPassword,
                    // No actualizamos cust_auth si ya existe
                    updated_at: new Date()
                });

                savedCustomer = await queryRunner.manager.save(updatedCustomer);
            } else {
                // Si no existe, crear uno nuevo
                // Obtener el ID máximo para esta compañía
                const maxResult = await queryRunner.manager
                    .createQueryBuilder()
                    .select('COALESCE(MAX(customer.cust_id), 0)', 'max')
                    .from(Customer, 'customer')
                    .where('customer.cust_cmpy = :cmpy', { cmpy: customerData.cmpy })
                    .getRawOne();

                const nextId = Number(maxResult.max) + 1;

                // Generar código alfanumérico único para cust_auth
                const authCode = this.generateAuthCode();

                // Crear nuevo tercero
                const newCustomer = this.CustomerRepository.create({
                    cust_id: nextId,
                    cust_cmpy: customerData.cmpy,
                    cust_active: 'Y',
                    cust_identification_number: customerData.identification_number,
                    cust_dv: customerData.dv,
                    cust_type_document_identification_id: customerData.type_document_identification_id,
                    cust_type_document_identification: customerData.type_document_identification,
                    cust_type_organization_id: customerData.type_organization_id,
                    cust_type_organization: customerData.type_organization,
                    cust_type_regime_id: customerData.type_regime_id,
                    cust_type_regime: customerData.type_regime,
                    cust_type_liability_id: customerData.type_liability_id,
                    cust_type_liability: customerData.type_liability,
                    cust_name: customerData.name,
                    cust_given_names: customerData.given_names,
                    cust_family_names: customerData.family_names,
                    cust_contact_name: customerData.contact_name,
                    cust_adinfo: customerData.additional_info,
                    cust_email: customerData.email,
                    cust_address: customerData.address,
                    cust_municipality_id: customerData.municipality_id,
                    cust_municipality: customerData.municipality,
                    cust_dep_id: customerData.dep_id,
                    cust_dep: customerData.dep,
                    cust_country_id: customerData.country_id,
                    cust_country: customerData.country,
                    cust_phone: customerData.phone,
                    cust_mobile: customerData.mobile,
                    cust_pass: hashedPassword,
                    cust_auth: authCode, // Asignar el código generado
                    created_at: new Date(),
                    updated_at: new Date()
                });

                savedCustomer = await queryRunner.manager.save(newCustomer);
            }

            await queryRunner.commitTransaction();

            return {
                message: "Tercero creado/actualizado con éxito",
                data: savedCustomer
            };

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new ConflictException('Error al crear / actualizar el tercero: ' + err.message);
        } finally {
            await queryRunner.release();
        }
    }

    // Función auxiliar para generar un código alfanumérico aleatorio usando crypto
    private generateAuthCode(): string {
        const crypto = require('crypto');
        // Generar un token aleatorio de 32 bytes (256 bits) y convertirlo a base64
        return crypto.randomBytes(32).toString('base64');
    }

    async findCustomers(cmpy: string, datoBusq: string): Promise<apiResponse<any[]>> {
        try {
            // Usamos parámetros en la consulta en lugar de concatenación de strings
            const customers = await this.CustomerRepository
                .createQueryBuilder('customer')
                .where('customer.cust_cmpy = :cmpy', { cmpy })
                .andWhere('customer.cust_active = :active', { active: 'Y' })
                .andWhere(
                    '(LOWER(customer.cust_name) LIKE :search OR ' +
                    'customer.cust_identification_number LIKE :search OR ' +
                    'LOWER(customer.cust_contact_name) LIKE :search)',
                    { search: `%${datoBusq.toLowerCase()}%` }
                )
                .getMany();

            // Procesar los datos y excluir cust_id
            const processedCustomers = customers.map(customer => {
                // Crear una copia del objeto customer sin cust_id
                const { cust_id, cust_active, ...customerData }: any = customer;

                // Añadir el campo name_
                if (!customer.cust_contact_name || customer.cust_contact_name === '-') {
                    customerData.name_ = customer.cust_name;
                } else {
                    customerData.name_ = `${customer.cust_name} (${customer.cust_contact_name})`;
                }

                return customerData;
            });

            return {
                message: "Búsqueda de Terceros",
                data: processedCustomers
            };
        } catch (error) {
            throw new ConflictException('Error al buscar terceros: ' + error.message);
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

    async remove(cmpy: string, identification: string): Promise<apiResponse> {
        // Verificar que el customer existe y está activo antes de intentar actualizarlo
        const customer = await this.CustomerRepository.findOne({
            where: {
                cust_cmpy: cmpy,
                cust_identification_number: identification,
                cust_active: 'Y' // Solo podemos eliminar terceros activos
            }
        });

        if (!customer) {
            throw new NotFoundException(`Tercero con identificación ${identification} no existe..!`);
        }

        // Actualizar directamente en la base de datos sin cargar el objeto completo
        await this.CustomerRepository.update(
            {
                cust_cmpy: cmpy,
                cust_identification_number: identification,
                cust_active: 'Y' // Asegurar que solo actualizamos terceros activos
            },
            {
                cust_active: 'N',
                updated_at: new Date()
            }
        );

        return {
            message: "Tercero eliminado correctamente!"
        };
    }

    async updatePassword(cmpy: string, identification: string, passwordData: UpdatePasswordDto): Promise<apiResponse<{ success: boolean }>> {
        try {
            // Verificar que el tercero existe
            const customer = await this.CustomerRepository.findOne({
                where: {
                    cust_cmpy: cmpy,
                    cust_identification_number: identification,
                    cust_active: 'Y'
                }
            });

            if (!customer) {
                throw new NotFoundException(`Tercero con identificación ${identification} no existe o está inactivo`);
            }

            // Generar hash seguro de la contraseña
            const hashedPassword = await this.passwordCryptoService.hashPassword(passwordData.password);

            // Actualizar la contraseña
            await this.CustomerRepository.update(
                {
                    cust_cmpy: cmpy,
                    cust_identification_number: identification,
                    cust_active: 'Y'
                },
                {
                    cust_pass: hashedPassword,
                    updated_at: new Date()
                }
            );

            return {
                message: "Contraseña actualizada correctamente",
                data: { success: true }
            };
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            throw new ConflictException('Error al actualizar la contraseña: ' + err.message);
        }
    }
}