import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { CreateSucursalDto } from "../dto";
import { Sucursal } from "../entities";

@Injectable()
export class SucursalService {
    constructor(
        @InjectRepository(Sucursal)
        private readonly SucursalRepository: Repository<Sucursal>,
        private dataSource: DataSource
    ) { }

    async create(createSucursalDto: CreateSucursalDto): Promise<Sucursal> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Obtener el siguiente ID para la compañía
            const maxResult = await queryRunner.manager
                .createQueryBuilder(Sucursal, 'sucursal')
                .where('sucursal.suc_cmpy = :cmpy', { company: createSucursalDto.cmpy })
                .select('COALESCE(MAX(sucursal.suc_id), 0)', 'max')
                .getRawOne();

            const nextId = Number(maxResult.max) + 1;

            // Crear la nueva sucursal
            const newSucursal = this.SucursalRepository.create({
                suc_cmpy: createSucursalDto.cmpy,
                suc_id: nextId,
                suc_nombre: createSucursalDto.name,
                suc_direccion: createSucursalDto.address,
                suc_email: createSucursalDto.email,
                suc_departamento: createSucursalDto.department,
                suc_ciudad: createSucursalDto.city,
                suc_ciudad_id: createSucursalDto.city_id,
                suc_telefono: createSucursalDto.phone,
                suc_celular: createSucursalDto.mobile,
                suc_razon: createSucursalDto.reason,
                suc_nit: createSucursalDto.tax_id,
                suc_logo: createSucursalDto.logo,
                suc_razon_dif: createSucursalDto.different_reason,
                suc_fact_cero: createSucursalDto.zero_invoice,
                suc_sw_code: createSucursalDto.sw_code,
                suc_sw: createSucursalDto.sw,
                suc_iva_incl: createSucursalDto.include_vat,
                suc_usu_mostra: createSucursalDto.show_users,
                suc_fact_elect: createSucursalDto.electronic_invoice,
                suc_activa: createSucursalDto.active,
                suc_reteica: createSucursalDto.reteica,
                suc_term: createSucursalDto.terms,
                suc_lista: createSucursalDto.list
            });

            const savedSucursal = await queryRunner.manager.save(newSucursal);
            await queryRunner.commitTransaction();

            return savedSucursal;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new ConflictException('Error al crear la sucursal: ' + err.message);
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(cmpy: string): Promise<Sucursal[]> {
        const sucursales = await this.SucursalRepository.findBy(
            { suc_cmpy: cmpy }
        );
        return sucursales;
    }

    async findOne(cmpy: string, ware: string): Promise<Sucursal> {
        const sucursal = await this.SucursalRepository.findOne({
            where: { suc_cmpy: cmpy, suc_nombre: ware }
        });

        if (!sucursal) {
            throw new NotFoundException(`Sucursal ${ware} no Existe`);
        }

        return sucursal;
    }

    async update(cmpy: string, ware: string, updateData: Partial<CreateSucursalDto>): Promise<Sucursal> {
        const sucursal = await this.SucursalRepository.findOne({
            where: { suc_cmpy: cmpy, suc_nombre: ware }
        });

        const updatedSucursal = await this.SucursalRepository.save(sucursal!);

        return updatedSucursal;
    }

    async remove(cmpy: string, ware: string): Promise<void> {
        const result = await this.SucursalRepository.delete(
            { suc_cmpy: cmpy, suc_nombre: ware }
        );

        if (result.affected === 0) {
            throw new NotFoundException(`Sucursal ${ware} no encontrada Existe`);
        }
    }

}
