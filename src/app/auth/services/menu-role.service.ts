import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { MenuRole, Menu, MenuOption } from '@auth/entities';
import { CreateMenuRoleDto, UpdateMenuRoleDto } from '@auth/dto';
import { apiResponse } from '@common/interfaces';

@Injectable()
export class MenuRoleService {
    constructor(
        @InjectRepository(MenuRole)
        private menuRoleRepository: Repository<MenuRole>,
        @InjectRepository(Menu)
        private menuRepository: Repository<Menu>,
        @InjectRepository(MenuOption)
        private menuOptionRepository: Repository<MenuOption>,
        private dataSource: DataSource
    ) { }

    async create(createMenuRoleDto: CreateMenuRoleDto): Promise<apiResponse<MenuRole>> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar que el menú exista
            const menu = await this.menuRepository.findOne({
                where: { m_id: createMenuRoleDto.menu_id }
            });

            if (!menu) {
                throw new NotFoundException(`Menú con ID ${createMenuRoleDto.menu_id} no encontrado`);
            }

            // Verificar que la opción de menú exista
            const menuOption = await this.menuOptionRepository.findOne({
                where: { mo_id: createMenuRoleDto.menu_option_id }
            });

            if (!menuOption) {
                throw new NotFoundException(`Opción de menú con ID ${createMenuRoleDto.menu_option_id} no encontrada`);
            }

            // Verificar si ya existe la asignación
            const existingMenuRole = await this.menuRoleRepository.findOne({
                where: {
                    mr_cmpy: createMenuRoleDto.cmpy,
                    mr_rol_id: createMenuRoleDto.role_id,
                    mr_menu_id: createMenuRoleDto.menu_id,
                    mr_menu_options_id: createMenuRoleDto.menu_option_id
                }
            });

            if (existingMenuRole) {
                throw new ConflictException(`Ya existe una asignación de menú para este rol, empresa y opción de menú`);
            }

            // Obtener el ID máximo actual
            const maxIdResult = await queryRunner.manager.query(
                'SELECT COALESCE(MAX(mr_id), 0) as max_id FROM pgfacture.pgx_menu_roles'
            );
            const nextId = parseInt(maxIdResult[0].max_id) + 1;

            // Crear la nueva asignación de menú a rol
            const menuRole = this.menuRoleRepository.create({
                mr_id: nextId,
                mr_cmpy: createMenuRoleDto.cmpy,
                mr_rol_id: createMenuRoleDto.role_id,
                mr_menu_id: createMenuRoleDto.menu_id,
                mr_menu_options_id: createMenuRoleDto.menu_option_id,
                mr_menu_options_title: createMenuRoleDto.menu_option_title || menuOption.mo_title
            });

            const savedMenuRole = await queryRunner.manager.save(menuRole);
            await queryRunner.commitTransaction();

            return {
                message: 'Asignación de menú a rol creada exitosamente',
                data: savedMenuRole
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            throw new ConflictException('Error al crear la asignación de menú a rol: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(): Promise<apiResponse<MenuRole[]>> {
        const menuRoles = await this.menuRoleRepository.find();

        return {
            message: 'Lista de asignaciones de menú a roles obtenida exitosamente',
            data: menuRoles
        };
    }

    async findByCompany(cmpy: string): Promise<apiResponse<MenuRole[]>> {
        const menuRoles = await this.menuRoleRepository.find({
            where: { mr_cmpy: cmpy }
        });

        return {
            message: `Asignaciones de menú para la empresa ${cmpy} obtenidas exitosamente`,
            data: menuRoles
        };
    }

    async findByRole(cmpy: string, roleId: string): Promise<apiResponse<MenuRole[]>> {
        const menuRoles = await this.menuRoleRepository.find({
            where: {
                mr_cmpy: cmpy,
                mr_rol_id: roleId
            }
        });

        return {
            message: `Asignaciones de menú para el rol ${roleId} en la empresa ${cmpy} obtenidas exitosamente`,
            data: menuRoles
        };
    }

    async findOne(id: number): Promise<apiResponse<MenuRole>> {
        const menuRole = await this.menuRoleRepository.findOne({
            where: { mr_id: id }
        });

        if (!menuRole) {
            throw new NotFoundException(`Asignación de menú a rol con ID ${id} no encontrada`);
        }

        return {
            message: 'Asignación de menú a rol encontrada',
            data: menuRole
        };
    }

    async update(id: number, updateMenuRoleDto: UpdateMenuRoleDto): Promise<apiResponse<MenuRole>> {
        const menuRole = await this.menuRoleRepository.findOne({
            where: { mr_id: id }
        });

        if (!menuRole) {
            throw new NotFoundException(`Asignación de menú a rol con ID ${id} no encontrada`);
        }

        // Solo se permite actualizar el título de la opción de menú
        if (updateMenuRoleDto.menu_option_title) {
            menuRole.mr_menu_options_title = updateMenuRoleDto.menu_option_title;
        }

        const updatedMenuRole = await this.menuRoleRepository.save(menuRole);

        return {
            message: 'Asignación de menú a rol actualizada exitosamente',
            data: updatedMenuRole
        };
    }

    async remove(id: number): Promise<apiResponse<void>> {
        const menuRole = await this.menuRoleRepository.findOne({
            where: { mr_id: id }
        });

        if (!menuRole) {
            throw new NotFoundException(`Asignación de menú a rol con ID ${id} no encontrada`);
        }

        await this.menuRoleRepository.remove(menuRole);

        return {
            message: 'Asignación de menú a rol eliminada exitosamente'
        };
    }

    async removeByRoleAndMenu(cmpy: string, roleId: string, menuId: number, menuOptionId: number): Promise<apiResponse<void>> {
        const menuRole = await this.menuRoleRepository.findOne({
            where: {
                mr_cmpy: cmpy,
                mr_rol_id: roleId,
                mr_menu_id: menuId,
                mr_menu_options_id: menuOptionId
            }
        });

        if (!menuRole) {
            throw new NotFoundException(`Asignación de menú a rol no encontrada para los parámetros especificados`);
        }

        await this.menuRoleRepository.remove(menuRole);

        return {
            message: 'Asignación de menú a rol eliminada exitosamente'
        };
    }

    // Método para obtener la estructura de menú para un rol específico
    async getMenuStructureForRole(cmpy: string, roleId: string): Promise<apiResponse<any>> {
        // Obtener todos los menús asignados al rol
        const menuRoles = await this.menuRoleRepository.find({
            where: {
                mr_cmpy: cmpy,
                mr_rol_id: roleId
            }
        });

        if (menuRoles.length === 0) {
            return {
                message: `No hay menús asignados al rol ${roleId} en la empresa ${cmpy}`,
                data: []
            };
        }

        // Agrupar por ID de menú
        const menuIds = [...new Set(menuRoles.map(mr => mr.mr_menu_id))];

        // Obtener la información de los menús
        const menus = await this.menuRepository.find({
            where: { m_id: In(menuIds), m_enabled: 'Y' },
            order: { m_order: 'ASC' }
        });

        // Construir la estructura jerárquica
        const result: { id: number; title: string; icon: string; options: any[] }[] = [];

        for (const menu of menus) {
            // Obtener las opciones de primer nivel para este menú y rol
            const menuRolesForThisMenu = menuRoles.filter(mr => mr.mr_menu_id === menu.m_id);
            const optionIds = menuRolesForThisMenu.map(mr => mr.mr_menu_options_id);

            // Obtener las opciones de menú correspondientes
            const menuOptions = await this.menuOptionRepository.find({
                where: { mo_id: In(optionIds), mo_enabled: 'Y' }
            });

            // Filtrar opciones de primer nivel (sin padre o padre fuera de las opciones permitidas)
            const firstLevelOptions = menuOptions.filter(
                option => !option.mo_parent_id || !optionIds.includes(option.mo_parent_id)
            );

            // Ordenar por orden
            firstLevelOptions.sort((a, b) => a.mo_order - b.mo_order);

            const menuWithOptions: { id: number; title: string; icon: string; options: any[] } = {
                id: menu.m_id,
                title: menu.m_title,
                icon: menu.m_icon,
                options: []
            };

            // Agregar las opciones de primer nivel con sus subopciones
            for (const option of firstLevelOptions) {
                const optionWithSuboptions = await this.buildRoleOptionHierarchy(option, menuOptions, optionIds);
                menuWithOptions.options.push(optionWithSuboptions);
            }

            result.push(menuWithOptions);
        }

        return {
            message: `Estructura de menú para el rol ${roleId} en la empresa ${cmpy} obtenida exitosamente`,
            data: result
        };
    }

    // Método auxiliar para construir la jerarquía de opciones para un rol
    private async buildRoleOptionHierarchy(option: MenuOption, allOptions: MenuOption[], allowedOptionIds: number[]): Promise<any> {
        // Filtrar las opciones hijas permitidas
        const children = allOptions.filter(opt =>
            opt.mo_parent_id === option.mo_id &&
            allowedOptionIds.includes(opt.mo_id)
        );

        // Ordenar por orden
        children.sort((a, b) => a.mo_order - b.mo_order);

        const result: {
            id: number;
            title: string;
            path: string;
            icon: string;
            class: string;
            isGroupTitle: boolean;
            level: number;
            submenu: any[];
        } = {
            id: option.mo_id,
            title: option.mo_title,
            path: option.mo_path,
            icon: option.mo_icon!,
            class: option.mo_class!,
            isGroupTitle: option.mo_is_group_title,
            level: option.mo_level,
            submenu: []
        };

        if (children.length > 0) {
            for (const child of children) {
                const childWithSuboptions = await this.buildRoleOptionHierarchy(child, allOptions, allowedOptionIds);
                result.submenu.push(childWithSuboptions);
            }
        }

        return result;
    }
}