import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { apiResponse } from '@common/interfaces';
import { Menu } from '@auth/entities';
import { CreateMenuDto, UpdateMenuDto } from '@auth/dto';

@Injectable()
export class MenuService {
    constructor(
        @InjectRepository(Menu)
        private menuRepository: Repository<Menu>,
        private dataSource: DataSource
    ) { }

    async create(createMenuDto: CreateMenuDto): Promise<apiResponse<Menu>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Obtener el ID máximo actual
            const maxIdResult = await queryRunner.manager.query(
                'SELECT COALESCE(MAX(m_id), 0) as max_id FROM pgfacture.pgx_menu'
            );
            const nextId = parseInt(maxIdResult[0].max_id) + 1;


            // Crear el nuevo menú
            const menu = this.menuRepository.create({
                m_id: nextId,
                m_path: createMenuDto.path || '',
                m_class: createMenuDto.clas || '',
                m_title: createMenuDto.title,
                m_icon: createMenuDto.icon,
                m_order: createMenuDto.order || nextId,
                m_enabled: createMenuDto.enabled || 'Y'
            });

            const savedMenu = await queryRunner.manager.save(menu);
            await queryRunner.commitTransaction();

            return {
                message: 'Menú creado exitosamente',
                data: savedMenu
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new ConflictException('Error al crear el menú: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(): Promise<apiResponse<Menu[]>> {
        const menus = await this.menuRepository.find({
            order: { m_order: 'ASC' }
        });

        return {
            message: 'Lista de menús obtenida exitosamente',
            data: menus
        };
    }

    async findOne(id: number): Promise<apiResponse<Menu>> {
        const menu = await this.menuRepository.findOne({
            where: { m_id: id }
        });

        if (!menu) {
            throw new NotFoundException(`Menú con ID ${id} no encontrado`);
        }

        return {
            message: 'Menú encontrado',
            data: menu
        };
    }

    async update(id: number, updateMenuDto: UpdateMenuDto): Promise<apiResponse<Menu>> {
        const menu = await this.menuRepository.findOne({
            where: { m_id: id }
        });

        if (!menu) {
            throw new NotFoundException(`Menú con ID ${id} no encontrado`);
        }

        // Actualizar propiedades
        if (updateMenuDto.title) menu.m_title = updateMenuDto.title;
        if (updateMenuDto.icon) menu.m_icon = updateMenuDto.icon;
        if (updateMenuDto.order !== undefined) menu.m_order = updateMenuDto.order;
        if (updateMenuDto.enabled) menu.m_enabled = updateMenuDto.enabled;
        if (updateMenuDto.path) menu.m_path = updateMenuDto.path;
        if (updateMenuDto.clas) menu.m_class = updateMenuDto.clas;

        const updatedMenu = await this.menuRepository.save(menu);

        return {
            message: 'Menú actualizado exitosamente',
            data: updatedMenu
        };
    }

    async remove(id: number): Promise<apiResponse<void>> {
        const menu = await this.menuRepository.findOne({
            where: { m_id: id }
        });

        if (!menu) {
            throw new NotFoundException(`Menú con ID ${id} no encontrado`);
        }

        await this.menuRepository.remove(menu);

        return {
            message: 'Menú eliminado exitosamente'
        };
    }
}