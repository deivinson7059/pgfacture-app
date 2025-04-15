import { ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Menu, MenuOption, MenuRole } from '../entities';
import { Logger } from '@nestjs/common';
import { apiResponse } from '@common/interfaces';

interface MenuStructure {
    path: string;
    title: string;
    icon: string;
    class: string;
    groupTitle: boolean;
    submenu: MenuStructure[];
}

@Injectable()
export class MenuInitializerService implements OnModuleInit {
    private readonly logger = new Logger(MenuInitializerService.name);

    constructor(
        @InjectRepository(Menu)
        private menuRepository: Repository<Menu>,
        @InjectRepository(MenuOption)
        private menuOptionRepository: Repository<MenuOption>,
        @InjectRepository(MenuRole)
        private menuRoleRepository: Repository<MenuRole>,
        private dataSource: DataSource
    ) { }

    async onModuleInit() {
        try {
            // Verificar si ya existen menús en la base de datos
            const menuCount = await this.menuRepository.count();

            if (menuCount === 0) {
                this.logger.log('Iniciando la carga de menús predeterminados...');
                await this.initializeDefaultMenus();
                this.logger.log('Menús predeterminados cargados exitosamente');
            } else {
                this.logger.log('La base de datos ya contiene menús. No se cargarán menús predeterminados.');
            }

            // Asignar todos los menús al rol DEVELOPER para la compañía ALL
            this.logger.log('Asignando todas las opciones de menú al rol DEVELOPER...');
            await this.assignAllMenusToDeveloper();
            this.logger.log('Menús asignados al rol DEVELOPER exitosamente');
        } catch (error) {
            this.logger.error('Error al inicializar los menús predeterminados:', error.stack);
        }
    }

    async initializeDefaultMenus() {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Definir los menús principales del sistema
            const mainMenus = [
                { id: 1, title: 'Configuraciones', icon: 'settings', class: 'menu-toggle', path: 'configs', order: 1 },
                { id: 2, title: 'Inventario', icon: 'align-justify', class: 'menu-toggle', path: 'inventory', order: 2 },
                { id: 3, title: 'Ingresos', icon: 'dollar-sign', class: 'menu-toggle', path: 'income', order: 3 },
                { id: 4, title: 'Compras', icon: 'shopping-bag', class: 'menu-toggle', path: 'expenses', order: 4 },
                { id: 5, title: 'Nóminas', icon: 'database', class: 'menu-toggle', path: 'payroll', order: 5 },
                { id: 6, title: 'Contador', icon: 'pen-tool', class: 'menu-toggle', path: 'accounting', order: 6 },
                { id: 7, title: 'Eventos RADIAN', icon: 'calendar', class: 'menu-toggle', path: 'radian-events', order: 7 },
                { id: 8, title: 'Reportes', icon: 'bar-chart-2', class: 'menu-toggle', path: 'reports', order: 8 }
            ];

            // Insertar menús principales verificando primero si ya existen
            for (const menu of mainMenus) {
                const existingMenu = await queryRunner.manager.findOne(Menu, {
                    where: { m_id: menu.id }
                });

                if (!existingMenu) {
                    await queryRunner.manager.insert(Menu, {
                        m_id: menu.id,
                        m_path: menu.path,
                        m_title: menu.title,
                        m_icon: menu.icon,
                        m_class: menu.class,
                        m_order: menu.order,
                        m_enabled: 'Y'
                    });
                }
            }

            // Cargar la estructura de menú desde paste.txt
            const menuStructure = this.getDefaultMenuStructure();

            // Obtener el máximo ID actual de opciones de menú
            const maxIdResult = await queryRunner.manager.query(
                'SELECT COALESCE(MAX(mo_id), 0) as max_id FROM pgfacture.pgx_menu_options'
            );
            let nextOptionId = parseInt(maxIdResult[0].max_id) + 1;

            // Mapeo para mantener registro de las opciones ya insertadas
            const insertedOptions = new Map();

            for (const menu of menuStructure) {
                const menuId = this.getMenuIdByTitle(menu.title, mainMenus);

                if (menuId) {
                    // Comprobar si esta opción de primer nivel ya existe
                    let parentOption = await queryRunner.manager.findOne(MenuOption, {
                        where: {
                            mo_menu_id: menuId,
                            mo_title: menu.title,
                            mo_parent_id: undefined
                        }
                    });

                    let parentId;

                    if (!parentOption) {
                        // Crear opción de primer nivel si no existe
                        parentOption = {
                            mo_id: nextOptionId++,
                            mo_menu_id: menuId,
                            mo_parent_id: null,
                            mo_title: menu.title,
                            mo_path: menu.path,
                            mo_icon: menu.icon,
                            mo_class: menu.class || null,
                            mo_level: 1,
                            mo_order: nextOptionId - 1,
                            mo_is_group_title: menu.groupTitle,
                            mo_enabled: 'Y'
                        };

                        await queryRunner.manager.insert(MenuOption, parentOption);
                        parentId = parentOption.mo_id;
                        insertedOptions.set(`${menuId}-${menu.title}`, parentId);
                    } else {
                        parentId = parentOption.mo_id;
                        insertedOptions.set(`${menuId}-${menu.title}`, parentId);
                    }

                    // Procesar subopciones (nivel 2)
                    if (menu.submenu && menu.submenu.length > 0) {
                        nextOptionId = await this.processSubmenus(
                            queryRunner,
                            menu.submenu,
                            menuId,
                            parentId,
                            nextOptionId,
                            2,
                            insertedOptions
                        );
                    }
                }
            }

            await queryRunner.commitTransaction();
            this.logger.log('Inicialización de menús completada con éxito');
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Error al inicializar los menús:', error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }



    // Método auxiliar para procesar subopciones de menú recursivamente
    private async processSubmenus(
        queryRunner: any,
        submenu: MenuStructure[],
        menuId: number,
        parentId: number,
        startId: number,
        level: number,
        insertedOptions: Map<string, number>
    ): Promise<number> {
        let currentId = startId;

        for (let i = 0; i < submenu.length; i++) {
            const option = submenu[i];

            // Comprobar si esta opción ya existe
            const key = `${menuId}-${parentId}-${option.title}`;
            let optionId;

            if (insertedOptions.has(key)) {
                optionId = insertedOptions.get(key);
            } else {
                // Verificar si la opción existe en la base de datos
                const existingOption = await queryRunner.manager.findOne(MenuOption, {
                    where: {
                        mo_menu_id: menuId,
                        mo_parent_id: parentId,
                        mo_title: option.title
                    }
                });

                if (existingOption) {
                    optionId = existingOption.mo_id;
                } else {
                    // Crear nueva opción de menú
                    const menuOption = {
                        mo_id: currentId++,
                        mo_menu_id: menuId,
                        mo_parent_id: parentId,
                        mo_title: option.title,
                        mo_path: option.path,
                        mo_icon: option.icon || null,
                        mo_class: option.class || null,
                        mo_level: level,
                        mo_order: i + 1,
                        mo_is_group_title: option.groupTitle,
                        mo_enabled: 'Y'
                    };

                    await queryRunner.manager.insert(MenuOption, menuOption);
                    optionId = menuOption.mo_id;
                }

                insertedOptions.set(key, optionId);
            }

            // Procesar subopciones (nivel siguiente)
            if (option.submenu && option.submenu.length > 0) {
                currentId = await this.processSubmenus(
                    queryRunner,
                    option.submenu,
                    menuId,
                    optionId,
                    currentId,
                    level + 1,
                    insertedOptions
                );
            }
        }

        return currentId;
    }

    // Método auxiliar para obtener el ID de menú basado en su título
    private getMenuIdByTitle(title: string, menus: any[]): number | null {
        const menu = menus.find(m => m.title === title);
        return menu ? menu.id : null;
    }

    /**
      * Asigna todas las opciones de menú disponibles al rol DEVELOPER para la compañía "ALL"
      * El DEVELOPER es el superadministrador y debe tener acceso a todo el sistema
      */
    async assignAllMenusToDeveloper(): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const DEVELOPER_ROLE = 'DEVELOPER';
            const ALL_COMPANY = 'ALL';

            // Verificar si el rol DEVELOPER existe
            const developerRole = await this.dataSource.manager.findOne('pgfacture.pgx_roles', {
                where: { rol_name: DEVELOPER_ROLE }
            });

            if (!developerRole) {
                this.logger.warn(`El rol ${DEVELOPER_ROLE} no existe en el sistema. Se creará automáticamente.`);

                // Obtener el máximo ID de rol actual
                const maxRoleIdResult = await queryRunner.manager.query(
                    'SELECT COALESCE(MAX(rol_id), 0) as max_id FROM pgfacture.pgx_roles'
                );
                const nextRoleId = parseInt(maxRoleIdResult[0].max_id) + 1;

                // Crear el rol DEVELOPER si no existe
                await queryRunner.manager.query(`
                INSERT INTO pgfacture.pgx_roles (rol_id, rol_name, rol_path, rol_enabled)
                VALUES ($1, $2, $3, $4)
            `, [nextRoleId, DEVELOPER_ROLE, 'admin', 'Y']);
            }

            // Obtener todos los menús activos
            const menus = await this.menuRepository.find({
                where: { m_enabled: 'Y' }
            });

            // Obtener todas las opciones de menú activas
            const menuOptions = await this.menuOptionRepository.find({
                where: { mo_enabled: 'Y' }
            });

            // Obtener asignaciones actuales para evitar duplicados
            const existingAssignments = await queryRunner.manager.query(`
            SELECT mr_menu_id, mr_menu_options_id 
            FROM pgfacture.pgx_menu_roles 
            WHERE mr_cmpy = $1 AND mr_rol_id = $2
        `, [ALL_COMPANY, DEVELOPER_ROLE]);

            // Crear un conjunto de las asignaciones existentes para búsqueda rápida
            const existingSet = new Set();
            existingAssignments.forEach((assignment: { mr_menu_id: number; mr_menu_options_id: number }) => {
                existingSet.add(`${assignment.mr_menu_id}-${assignment.mr_menu_options_id}`);
            });

            // Obtener el máximo ID actual
            const maxIdResult = await queryRunner.manager.query(
                'SELECT COALESCE(MAX(mr_id), 0) as max_id FROM pgfacture.pgx_menu_roles'
            );
            let nextId = parseInt(maxIdResult[0].max_id) + 1;

            // Lista para almacenar las nuevas asignaciones
            const newAssignments: {
                mr_id: number;
                mr_cmpy: string;
                mr_rol_id: string;
                mr_menu_id: number;
                mr_menu_options_id: number;
                mr_menu_options_title: string;
            }[] = [];

            // Preparar asignaciones para cada opción de menú
            for (const option of menuOptions) {
                // Verificar si la asignación ya existe
                const key = `${option.mo_menu_id}-${option.mo_id}`;
                if (!existingSet.has(key)) {
                    newAssignments.push({
                        mr_id: nextId++,
                        mr_cmpy: ALL_COMPANY,
                        mr_rol_id: DEVELOPER_ROLE,
                        mr_menu_id: option.mo_menu_id,
                        mr_menu_options_id: option.mo_id,
                        mr_menu_options_title: option.mo_title
                    });
                }
            }

            // Insertar nuevas asignaciones en lotes de 100 para evitar problemas de rendimiento
            if (newAssignments.length > 0) {
                const batchSize = 100;
                for (let i = 0; i < newAssignments.length; i += batchSize) {
                    const batch = newAssignments.slice(i, i + batchSize);
                    await queryRunner.manager.insert('pgfacture.pgx_menu_roles', batch);
                }
            }

            await queryRunner.commitTransaction();

            this.logger.log(`Se han asignado todas las opciones de menú al rol ${DEVELOPER_ROLE} para la compañía ${ALL_COMPANY}`);
            this.logger.log(`Total de menús: ${menus.length}, Total de opciones: ${menuOptions.length}`);
            this.logger.log(`Nuevas asignaciones: ${newAssignments.length}, Asignaciones existentes: ${existingAssignments.length}`);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Error al asignar menús al rol DEVELOPER:', error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // Método para obtener la estructura de menú predeterminada
    private getDefaultMenuStructure(): MenuStructure[] {
        // Esta es la estructura del menú parseada desde el archivo paste.txt
        return [
            {
                path: "/dashboard/main",
                title: "Dashboards",
                icon: "monitor",
                class: "",
                groupTitle: false,
                submenu: []
            },
            {
                path: "configs",
                title: "Configuraciones",
                icon: "settings",
                class: "menu-toggle",
                groupTitle: false,
                submenu: [
                    {
                        path: "configs/general",
                        title: "Generales",
                        icon: "",
                        class: "ml-sub-menu",
                        groupTitle: false,
                        submenu: [
                            {
                                path: "configs/general/legal",
                                title: "Legal",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/general/invoice",
                                title: "Facturación",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/general/pos",
                                title: "Facturación POS",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/general/print_fromats",
                                title: "Formatos de impresión",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/general/adjustments",
                                title: "Inventarios",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/general/payroll",
                                title: "Nómina",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/general/price_list",
                                title: "Listas de precios",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/general/logos",
                                title: "Logos",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/general/bar",
                                title: "Bar/restaurante",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/general/health",
                                title: "Sector salud",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            }
                        ]
                    },
                    {
                        path: "configs/warehouse",
                        title: "Puntos de venta",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "configs/seats",
                        title: "Contabilidad",
                        icon: "",
                        class: "ml-sub-menu",
                        groupTitle: false,
                        submenu: [
                            {
                                path: "configs/seats/accounting",
                                title: "Param. Cuentas",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            },
                            {
                                path: "configs/seats/payroll",
                                title: "Param. Nómina",
                                icon: "",
                                class: "",
                                groupTitle: false,
                                submenu: []
                            }
                        ]
                    }
                ]
            },
            {
                path: "inventory",
                title: "Inventario",
                icon: "align-justify",
                class: "menu-toggle",
                groupTitle: false,
                submenu: [
                    {
                        path: "inventory/products",
                        title: "Productos",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "inventory/services",
                        title: "Servicios",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "inventory/price_list",
                        title: "Listas de precios",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "inventory/transfers",
                        title: "Traslados",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "inventory/prices",
                        title: "Precio, costos y utilidades",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "inventory/adjustments",
                        title: "Ajustes de Inventario",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "inventory/transforms",
                        title: "Transformaciones",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "inventory/categorizer",
                        title: "Categorizador",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "inventory/audit",
                        title: "Auditorias de Inventario",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "inventory/warranties",
                        title: "Garantias",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    }
                ]
            },
            {
                path: "income",
                title: "Ingresos",
                icon: "dollar-sign",
                class: "menu-toggle",
                groupTitle: false,
                submenu: [
                    {
                        path: "income/invoices",
                        title: "Facturación",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/pos",
                        title: "Facturación POS",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/remision",
                        title: "Remisiones",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/payments",
                        title: "Pagos Recibidos",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/accounts",
                        title: "Cajas",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/picking",
                        title: "Panel Despachos",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/quotations",
                        title: "Cotizaciones",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/credit-notes",
                        title: "Notas Crédito",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/advances",
                        title: "Anticipos De Cliente",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/unknown",
                        title: "Depositos Sin Identificar",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "income/checks",
                        title: "Cheques",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    }
                ]
            },
            {
                path: "expenses",
                title: "Compras",
                icon: "shopping-bag",
                class: "menu-toggle",
                groupTitle: false,
                submenu: [
                    {
                        path: "expenses/r-expenses",
                        title: "Gastos",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "expenses/provider-invoice",
                        title: "Factura de Proveedor",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "expenses/outgoing-payments",
                        title: "Egresos",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "expenses/purchase-orders",
                        title: "Ordenes de Compra Proveedor",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "expenses/imports",
                        title: "Importaciones",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "expenses/taxes",
                        title: "Impuestos de Importación",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "expenses/debit-notes",
                        title: "Notas Débito",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    }
                ]
            },
            {
                path: "payroll",
                title: "Nóminas",
                icon: "database",
                class: "menu-toggle",
                groupTitle: false,
                submenu: [
                    {
                        path: "payroll/employees",
                        title: "Empleados",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "payroll/wages",
                        title: "Listado de Nominas",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "payroll/payments",
                        title: "Pagos de Nominas",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "payroll/aportes",
                        title: "Aportes de Nomina",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "payroll/liquidation",
                        title: "Liquidacion de Empleados",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    }
                ]
            },
            {
                path: "accounting",
                title: "Contador",
                icon: "pen-tool",
                class: "menu-toggle",
                groupTitle: false,
                submenu: [
                    {
                        path: "/accounting/notes",
                        title: "Listar Notas contables",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    },
                    {
                        path: "/accounting/expenses",
                        title: "Gastos Parametrizados",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    }
                ]
            },
            {
                path: "radian-events",
                title: "Eventos RADIAN",
                icon: "calendar",
                class: "menu-toggle",
                groupTitle: false,
                submenu: [
                    {
                        path: "radian-events/notifications",
                        title: "Buzón tributario",
                        icon: "",
                        class: "",
                        groupTitle: false,
                        submenu: []
                    }
                ]
            },
            {
                path: "reports",
                title: "Reportes",
                icon: "bar-chart-2",
                class: "menu-toggle",
                groupTitle: false,
                submenu: []
            }
        ];
    }
}