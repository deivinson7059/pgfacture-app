import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { CreateMenuOptionDto, UpdateMenuOptionDto } from '@auth/dto';
import { apiResponse } from '@common/interfaces';
import { Menu, MenuOption } from '@auth/entities';

@Injectable()
export class MenuOptionService {
    constructor(
        @InjectRepository(MenuOption)
        private menuOptionRepository: Repository<MenuOption>,
        @InjectRepository(Menu)
        private menuRepository: Repository<Menu>,
        private dataSource: DataSource
    ) { }

    async create(createMenuOptionDto: CreateMenuOptionDto): Promise<apiResponse<MenuOption>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que el menú exista
            const menu = await this.menuRepository.findOne({
                where: { m_id: createMenuOptionDto.menu_id }
            });

            if (!menu) {
                throw new NotFoundException(`Menú con ID ${createMenuOptionDto.menu_id} no encontrado`);
            }

            // Verificar que el padre exista si se proporciona
            if (createMenuOptionDto.parent_id) {
                const parent = await this.menuOptionRepository.findOne({
                    where: { mo_id: createMenuOptionDto.parent_id }
                });

                if (!parent) {
                    throw new NotFoundException(`Opción de menú padre con ID ${createMenuOptionDto.parent_id} no encontrada`);
                }
            }

            // Obtener el ID máximo actual
            const maxIdResult = await queryRunner.manager.query(
                'SELECT COALESCE(MAX(mo_id), 0) as max_id FROM pgfacture.pgx_menu_options'
            );
            const nextId = parseInt(maxIdResult[0].max_id) + 1;

            // Crear la nueva opción de menú
            const menuOption = this.menuOptionRepository.create({
                mo_id: nextId,
                mo_menu_id: createMenuOptionDto.menu_id,
                mo_parent_id: createMenuOptionDto.parent_id || null,
                mo_title: createMenuOptionDto.title,
                mo_path: createMenuOptionDto.path,
                mo_icon: createMenuOptionDto.icon || null,
                mo_class: createMenuOptionDto.class || null,
                mo_level: createMenuOptionDto.level || 1,
                mo_order: createMenuOptionDto.order || nextId,
                mo_is_group_title: createMenuOptionDto.is_group_title || false,
                mo_enabled: createMenuOptionDto.enabled || 'Y'
            });

            const savedMenuOption = await queryRunner.manager.save(menuOption);
            await queryRunner.commitTransaction();

            return {
                message: 'Opción de menú creada exitosamente',
                data: savedMenuOption
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new ConflictException('Error al crear la opción de menú: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(): Promise<apiResponse<MenuOption[]>> {
        const menuOptions = await this.menuOptionRepository.find({
            order: { mo_menu_id: 'ASC', mo_level: 'ASC', mo_order: 'ASC' }
        });

        return {
            message: 'Lista de opciones de menú obtenida exitosamente',
            data: menuOptions
        };
    }

    async findByMenuId(menuId: number): Promise<apiResponse<MenuOption[]>> {
        const menuOptions = await this.menuOptionRepository.find({
            where: { mo_menu_id: menuId },
            order: { mo_level: 'ASC', mo_order: 'ASC' }
        });

        return {
            message: `Opciones del menú ${menuId} obtenidas exitosamente`,
            data: menuOptions
        };
    }

    async findByParentId(parentId: number): Promise<apiResponse<MenuOption[]>> {
        const menuOptions = await this.menuOptionRepository.find({
            where: { mo_parent_id: parentId },
            order: { mo_order: 'ASC' }
        });

        return {
            message: `Subopciones de la opción ${parentId} obtenidas exitosamente`,
            data: menuOptions
        };
    }

    async findOne(id: number): Promise<apiResponse<MenuOption>> {
        const menuOption = await this.menuOptionRepository.findOne({
            where: { mo_id: id }
        });

        if (!menuOption) {
            throw new NotFoundException(`Opción de menú con ID ${id} no encontrada`);
        }

        return {
            message: 'Opción de menú encontrada',
            data: menuOption
        };
    }

    async update(id: number, updateMenuOptionDto: UpdateMenuOptionDto): Promise<apiResponse<MenuOption>> {
        const menuOption = await this.menuOptionRepository.findOne({
            where: { mo_id: id }
        });

        if (!menuOption) {
            throw new NotFoundException(`Opción de menú con ID ${id} no encontrada`);
        }

        // Verificar que el menú exista si se actualiza
        if (updateMenuOptionDto.menu_id) {
            const menu = await this.menuRepository.findOne({
                where: { m_id: updateMenuOptionDto.menu_id }
            });

            if (!menu) {
                throw new NotFoundException(`Menú con ID ${updateMenuOptionDto.menu_id} no encontrado`);
            }
            menuOption.mo_menu_id = updateMenuOptionDto.menu_id;
        }

        // Verificar que el padre exista si se actualiza
        if (updateMenuOptionDto.parent_id) {
            const parent = await this.menuOptionRepository.findOne({
                where: { mo_id: updateMenuOptionDto.parent_id }
            });

            if (!parent) {
                throw new NotFoundException(`Opción de menú padre con ID ${updateMenuOptionDto.parent_id} no encontrada`);
            }
            menuOption.mo_parent_id = updateMenuOptionDto.parent_id;
        } else if (updateMenuOptionDto.parent_id === null) {
            menuOption.mo_parent_id = null;
        }

        // Actualizar demás propiedades
        if (updateMenuOptionDto.title) menuOption.mo_title = updateMenuOptionDto.title;
        if (updateMenuOptionDto.path) menuOption.mo_path = updateMenuOptionDto.path;
        if (updateMenuOptionDto.icon !== undefined) menuOption.mo_icon = updateMenuOptionDto.icon;
        if (updateMenuOptionDto.class !== undefined) menuOption.mo_class = updateMenuOptionDto.class;
        if (updateMenuOptionDto.level !== undefined) menuOption.mo_level = updateMenuOptionDto.level;
        if (updateMenuOptionDto.order !== undefined) menuOption.mo_order = updateMenuOptionDto.order;
        if (updateMenuOptionDto.is_group_title !== undefined) menuOption.mo_is_group_title = updateMenuOptionDto.is_group_title;
        if (updateMenuOptionDto.enabled) menuOption.mo_enabled = updateMenuOptionDto.enabled;

        const updatedMenuOption = await this.menuOptionRepository.save(menuOption);

        return {
            message: 'Opción de menú actualizada exitosamente',
            data: updatedMenuOption
        };
    }

    async remove(id: number): Promise<apiResponse<void>> {
        const menuOption = await this.menuOptionRepository.findOne({
            where: { mo_id: id }
        });

        if (!menuOption) {
            throw new NotFoundException(`Opción de menú con ID ${id} no encontrada`);
        }

        // Verificar si tiene subopciones
        const hasChildren = await this.menuOptionRepository.count({
            where: { mo_parent_id: id }
        });

        if (hasChildren > 0) {
            throw new ConflictException(`No se puede eliminar la opción de menú porque tiene ${hasChildren} subopciones asociadas`);
        }

        await this.menuOptionRepository.remove(menuOption);

        return {
            message: 'Opción de menú eliminada exitosamente'
        };
    }

    // Método para obtener un menú completo con su estructura jerárquica
    async getMenuStructure(menuId?: number): Promise<apiResponse<any>> {
        const queryBuilder = this.menuRepository.createQueryBuilder('menu');

        if (menuId) {
            queryBuilder.where('menu.m_id = :menuId', { menuId });
        }

        queryBuilder.andWhere('menu.m_enabled = :enabled', { enabled: 'Y' });
        queryBuilder.orderBy('menu.m_order', 'ASC');

        const menus = await queryBuilder.getMany();

        const result: { id: number; title: string; icon: string | null; options: any[] }[] = [];

        for (const menu of menus) {
            const firstLevelOptions = await this.menuOptionRepository.find({
                where: {
                    mo_menu_id: menu.m_id,
                    mo_parent_id: undefined,
                    mo_enabled: 'Y'
                },
                order: { mo_order: 'ASC' }
            });

            const menuWithOptions: {
                id: number;
                title: string;
                icon: string | null;
                options: any[];
            } = {
                id: menu.m_id,
                title: menu.m_title,
                icon: menu.m_icon,
                options: []
            };

            for (const option of firstLevelOptions) {
                const optionWithSuboptions = await this.buildOptionHierarchy(option);
                menuWithOptions.options.push(optionWithSuboptions);
            }

            result.push(menuWithOptions);
        }

        return {
            message: 'Estructura de menú obtenida exitosamente',
            data: result
        };
    }

    // Método auxiliar para construir la jerarquía de opciones
    private async buildOptionHierarchy(option: MenuOption): Promise<any> {
        const children = await this.menuOptionRepository.find({
            where: {
                mo_parent_id: option.mo_id,
                mo_enabled: 'Y'
            },
            order: { mo_order: 'ASC' }
        });

        const result: {
            id: number;
            title: string;
            path: string | null;
            icon: string | null;
            class: string | null;
            isGroupTitle: boolean;
            level: number;
            submenu: any[];
        } = {
            id: option.mo_id,
            title: option.mo_title,
            path: option.mo_path,
            icon: option.mo_icon,
            class: option.mo_class,
            isGroupTitle: option.mo_is_group_title,
            level: option.mo_level,
            submenu: []
        };

        if (children.length > 0) {
            for (const child of children) {
                const childWithSuboptions = await this.buildOptionHierarchy(child);
                result.submenu.push(childWithSuboptions);
            }
        }

        return result;
    }
}