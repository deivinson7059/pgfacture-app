import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Scope, Role, RoleScope } from '../entities';

@Injectable()
export class ScopesInitializerService implements OnModuleInit {
    private readonly logger = new Logger(ScopesInitializerService.name);

    constructor(
        @InjectRepository(Scope)
        private readonly scopeRepository: Repository<Scope>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(RoleScope)
        private readonly roleScopeRepository: Repository<RoleScope>,
        private dataSource: DataSource
    ) { }

    async onModuleInit() {
        try {
            this.logger.log('Iniciando la inicialización de scopes...');

            // Verificar si ya existen scopes en la base de datos
            const scopesCount = await this.scopeRepository.count();

            if (scopesCount === 0) {
                this.logger.log('No se encontraron scopes. Creando scopes predeterminados...');
                await this.initializeDefaultScopes();
            } else {
                this.logger.log(`Se encontraron ${scopesCount} scopes existentes. Verificando si falta alguno...`);
                await this.updateExistingScopes();
            }

            // Asignar todos los scopes al rol DEVELOPER
            await this.assignScopesToDeveloper();

            this.logger.log('Inicialización de scopes completada exitosamente.');
        } catch (error) {
            this.logger.error('Error durante la inicialización de scopes:', error.stack);
        }
    }

    /**
     * Inicializa los scopes predeterminados del sistema
     */
    private async initializeDefaultScopes(): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const scopes = this.getDefaultScopes();

            // Insertar todos los scopes
            for (const scope of scopes) {
                await queryRunner.manager.insert(Scope, {
                    s_id: scope.id,
                    s_description: scope.description,
                    s_active: 'Y'
                });
            }

            this.logger.log(`Se han creado ${scopes.length} scopes predeterminados.`);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Error al crear scopes predeterminados:', error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Actualiza los scopes existentes y añade los que faltan
     */
    private async updateExistingScopes(): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const existingScopes = await queryRunner.manager.find(Scope);
            const existingScopeIds = existingScopes.map(scope => scope.s_id);

            const defaultScopes = this.getDefaultScopes();
            const missingScopes = defaultScopes.filter(scope => !existingScopeIds.includes(scope.id));

            // Insertar solo los scopes que faltan
            if (missingScopes.length > 0) {
                for (const scope of missingScopes) {
                    await queryRunner.manager.insert(Scope, {
                        s_id: scope.id,
                        s_description: scope.description,
                        s_active: 'Y'
                    });
                }

                this.logger.log(`Se han añadido ${missingScopes.length} nuevos scopes.`);
            } else {
                this.logger.log('No se encontraron nuevos scopes para añadir.');
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Error al actualizar scopes existentes:', error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Asigna todos los scopes al rol DEVELOPER
     */
    private async assignScopesToDeveloper(): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Buscar el rol DEVELOPER
            const DEVELOPER_ROLE = 'DEVELOPER';
            const developerRole = await queryRunner.manager.findOne(Role, {
                where: { rol_name: DEVELOPER_ROLE }
            });

            if (!developerRole) {
                this.logger.warn(`El rol ${DEVELOPER_ROLE} no existe en el sistema. No se pueden asignar scopes.`);
                await queryRunner.commitTransaction();
                return;
            }

            // Obtener todos los scopes activos
            const activeScopes = await queryRunner.manager.find(Scope, {
                where: { s_active: 'Y' }
            });

            // Obtener los scopes ya asignados al rol DEVELOPER
            const existingRoleScopes = await queryRunner.manager.find(RoleScope, {
                where: { rs_role_id: developerRole.rol_id }
            });

            const existingScopeIds = existingRoleScopes.map(rs => rs.rs_scope_id);

            // Filtrar los scopes que aún no están asignados
            const scopesToAssign = activeScopes.filter(scope => !existingScopeIds.includes(scope.s_id));

            // Asignar los scopes faltantes al rol DEVELOPER
            if (scopesToAssign.length > 0) {
                const roleScopes = scopesToAssign.map(scope => ({
                    rs_role_id: developerRole.rol_id,
                    rs_scope_id: scope.s_id
                }));

                await queryRunner.manager.insert(RoleScope, roleScopes);

                this.logger.log(`Se han asignado ${scopesToAssign.length} nuevos scopes al rol ${DEVELOPER_ROLE}.`);
            } else {
                this.logger.log(`El rol ${DEVELOPER_ROLE} ya tiene todos los scopes asignados.`);
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Error al asignar scopes al rol DEVELOPER:', error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Define los scopes predeterminados del sistema
     */
    private getDefaultScopes(): { id: string; description: string }[] {
        return [
            { id: "read:users", description: "Ver información de usuarios" },
            { id: "write:users", description: "Crear/modificar usuarios" },
            { id: "delete:users", description: "Eliminar usuarios" },
            { id: "read:roles", description: "Ver roles" },
            { id: "write:roles", description: "Crear/modificar roles" },
            { id: "read:scopes", description: "Ver permisos" },
            { id: "write:scopes", description: "Asignar permisos" },
            { id: "read:company", description: "Ver información de compañías" },
            { id: "write:company", description: "Crear/modificar compañías" },
            { id: "read:warehouse", description: "Ver sucursales" },
            { id: "write:warehouse", description: "Crear/modificar sucursales" },
            { id: "read:settings", description: "Ver configuraciones generales" },
            { id: "write:settings", description: "Modificar configuraciones generales" },
            { id: "read:account_config", description: "Ver configuraciones contables" },
            { id: "write:account_config", description: "Modificar configuraciones contables" },
            { id: "read:payroll_config", description: "Ver configuraciones de nómina" },
            { id: "write:payroll_config", description: "Modificar configuraciones de nómina" },
            { id: "read:accounting", description: "Ver información contable general" },
            { id: "write:accounting", description: "Registrar asientos contables" },
            { id: "read:balance", description: "Ver balances" },
            { id: "write:balance", description: "Generar balances" },
            { id: "read:journals", description: "Ver libro diario" },
            { id: "read:ledgers", description: "Ver libro mayor" },
            { id: "read:notes", description: "Ver notas contables" },
            { id: "write:notes", description: "Crear/modificar notas contables" },
            { id: "approve:notes", description: "Aprobar notas contables" },
            { id: "read:periods", description: "Ver períodos contables" },
            { id: "write:periods", description: "Crear/modificar períodos contables" },
            { id: "close:periods", description: "Cerrar períodos contables" },
            { id: "read:puc", description: "Ver plan único de cuentas" },
            { id: "write:puc", description: "Modificar plan único de cuentas" },
            { id: "read:niif_reports", description: "Ver reportes NIIF" },
            { id: "write:niif_reports", description: "Generar reportes NIIF" },
            { id: "read:inventory", description: "Ver inventario" },
            { id: "write:inventory", description: "Modificar inventario" },
            { id: "read:products", description: "Ver productos" },
            { id: "write:products", description: "Crear/modificar productos" },
            { id: "read:sales", description: "Ver ventas" },
            { id: "write:sales", description: "Registrar ventas" },
            { id: "read:invoices", description: "Ver facturas" },
            { id: "write:invoices", description: "Crear facturas" },
            { id: "void:invoices", description: "Anular facturas" },
            { id: "read:quotations", description: "Ver cotizaciones" },
            { id: "write:quotations", description: "Crear cotizaciones" },
            { id: "read:purchases", description: "Ver compras" },
            { id: "write:purchases", description: "Registrar compras" },
            { id: "read:expenses", description: "Ver gastos" },
            { id: "write:expenses", description: "Registrar gastos" },
            { id: "read:providers", description: "Ver proveedores" },
            { id: "write:providers", description: "Crear/modificar proveedores" },
            { id: "read:payroll", description: "Ver nómina" },
            { id: "write:payroll", description: "Procesar nómina" },
            { id: "read:employees", description: "Ver empleados" },
            { id: "write:employees", description: "Crear/modificar empleados" },
            { id: "read:reports", description: "Ver reportes" },
            { id: "export:reports", description: "Exportar reportes" },
            { id: "read:customers", description: "Ver clientes" },
            { id: "write:customers", description: "Crear/modificar clientes" },
            { id: "delete:customers", description: "Eliminar clientes" },
            { id: "read:api_config", description: "Ver configuración de API" },
            { id: "write:api_config", description: "Modificar configuración de API" },
            { id: "read:electronic_docs", description: "Ver documentos electrónicos" },
            { id: "write:electronic_docs", description: "Emitir documentos electrónicos" },
            { id: "read:radian", description: "Ver eventos RADIAN" },
            { id: "write:radian", description: "Registrar eventos RADIAN" },
            { id: "read:security_access", description: "Consultar permisos de seguridad" },
            { id: "write:security_access", description: "Modificar permisos de seguridad" }
        ];
    }

    /**
     * Método público para ejecutar la inicialización bajo demanda
     */
    async initializeScopes(): Promise<{ message: string, data: { success: boolean } }> {
        try {
            await this.initializeDefaultScopes();
            await this.assignScopesToDeveloper();

            return {
                message: "Scopes inicializados y asignados al rol DEVELOPER correctamente",
                data: { success: true }
            };
        } catch (error) {
            this.logger.error('Error al inicializar scopes:', error.stack);
            throw error;
        }
    }
}