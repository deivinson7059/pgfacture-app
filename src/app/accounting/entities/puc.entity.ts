import { Entity, PrimaryColumn, Column, BeforeInsert, BeforeUpdate, CreateDateColumn, Index } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_account_plan' }) // Nombre de la tabla en la base de datos
@Index('idx_account_plan_parent', ['plcu_parent_account']) // Índice para búsquedas por cuenta padre
@Index('idx_account_plan_cmpy_active', ['plcu_cmpy', 'plcu_active']) // Índice compuesto para filtros por empresa y estado
@Index('idx_account_plan_classification', ['plcu_classification']) // Índice para filtros por clasificación
//plan de cuentas
export class Puc {
    @PrimaryColumn({ name: 'plcu_id', type: 'varchar', length: 20 })
    @Expose({ name: 'code' }) // Mapear a "code"
    plcu_id: string; // Código de la cuenta

    @PrimaryColumn({ name: 'plcu_cmpy', type: 'varchar', length: 10, default: 'ALL' })
    @Expose({ name: 'cmpy' }) // Mapear a "cmpy"
    plcu_cmpy: string; // Código de la empresa (char(10))

    @Column({ name: 'plcu_description', type: 'varchar', length: 500 })
    @Index('idx_account_plan_description') // Índice para búsquedas por descripción   
    @Expose({ name: 'description' }) // Mapear a "description"
    plcu_description: string; // Descripción de la cuenta

    @Column({ name: 'plcu_nature', type: 'varchar', length: 10 })
    @Index('idx_account_plan_nature') // Índice para filtros por naturaleza
    @Expose({ name: 'nature' }) // Mapear a "nature"
    plcu_nature: string; // Naturaleza de la cuenta (Débito o Crédito)

    @Column({ name: 'plcu_classification', type: 'varchar', length: 20, nullable: true })
    @Expose({ name: 'classification' }) // Mapear a "classification"
    plcu_classification: string | null; // Clasificación de la cuenta

    @Column({ name: 'plcu_parent_account', type: 'varchar', length: 20, nullable: true })
    @Expose({ name: 'parent_account' }) // Mapear a "parent_account"
    plcu_parent_account: string | null; // Cuenta madre (relación jerárquica)

    @Column({ name: 'plcu_active', type: 'char', length: 1, default: 'Y' })
    @Expose({ name: 'active' }) // Mapear a "active"
    plcu_active: string; // Estado de la cuenta (Y: Activo, N: Inactivo)

    @Column({ name: 'plcu_creation_by', type: 'varchar', length: 30 })
    @Expose({ name: 'creation_by' }) // Mapear a "creation_by"
    @Exclude() 
    plcu_creation_by: string; // Usuario que registró la cuenta

    @CreateDateColumn({
        name: 'plcu_creation_date',
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer()
    })
    //@Column({ name: 'PLCU_CREATION_DATE', type: 'date', default: () => 'CURRENT_DATE' })
    @Expose({ name: 'creation_date' }) // Mapear a "creation_date"
    @Exclude()
    plcu_creation_date: Date; // Fecha de creación

    @Column({ name: 'plcu_updated_by', type: 'varchar', length: 30, nullable: true })
    @Expose({ name: 'updated_by' }) // Mapear a "updated_by"
    @Exclude()
    plcu_updated_by: string | null; // Usuario que actualizó la cuenta

    @CreateDateColumn({
        name: 'plcu_updated_date',
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer()
    })
    //@Column({ name: 'PLCU_UPDATED_DATE', type: 'date', default: () => 'CURRENT_DATE' })
    @Expose({ name: 'updated_date' }) // Mapear a "change_date"
    @Exclude()
    plcu_updated_date: Date; // Fecha de última modificación

    // Método para calcular la naturaleza, clasificación, padre y fechas
    @BeforeInsert()
    @BeforeUpdate()
    calculateFields() {
        const idLength = this.plcu_id.length;

        // Calcular la naturaleza en función del primer dígito del PLCU_ID
        const firstDigit = this.plcu_id.charAt(0);
        switch (firstDigit) {
            case '1':
            case '5':
            case '6':
            case '7':
                this.plcu_nature = 'DEBITO';
                break;
            case '2':
            case '3':
            case '4':
            case '8':
            case '9':
                this.plcu_nature = 'CREDITO';
                break;
            default:
                throw new Error('El primer dígito del PLCU_ID no es válido.');
        }

        // Calcular la clasificación en función de la longitud del PLCU_ID
        if (idLength === 1) {
            this.plcu_classification = 'CLASE';
        } else if (idLength === 2) {
            this.plcu_classification = 'GRUPO';
        } else if (idLength === 4) {
            this.plcu_classification = 'CUENTA';
        } else if (idLength === 6) {
            this.plcu_classification = 'SUBCUENTA';
        } else if (idLength === 8) {
            this.plcu_classification = 'AUXILIAR';
        }else if (idLength === 10) {
            this.plcu_classification = 'AUXILIAR2';
        }

        // Calcular el padre automáticamente
        if (idLength > 8) {
            this.plcu_parent_account = this.plcu_id.slice(0, 8); // Auxiliar2 -> Auxiliar
        } else if (idLength > 6) {
            this.plcu_parent_account = this.plcu_id.slice(0, 6); // Auxiliar -> Subcuenta
        } else if (idLength > 4) {
            this.plcu_parent_account = this.plcu_id.slice(0, 4); // Subcuenta -> Cuenta
        } else if (idLength > 2) {
            this.plcu_parent_account = this.plcu_id.slice(0, 2); // Cuenta  -> Grupo 
        } else if (idLength > 1) {
            this.plcu_parent_account = this.plcu_id.slice(0, 1); // Grupo -> Clase 
        } else {
            this.plcu_parent_account = null; // Grupo no tiene padre
        }

        // Actualizar la fecha de modificación
        //this.PLCU_UPDATED_DATE = new Date();
    }
}