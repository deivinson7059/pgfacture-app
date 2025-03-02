import { Expose, Transform } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, PrimaryColumn, BeforeInsert } from 'typeorm';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_seat' }) // Nombre de la tabla en la base de datos
@Index('idx_accounting_seat_cmpy', ['acch_cmpy', 'acch_ware']) // Índice compuesto para filtros
@Index('idx_accounting_seat_acch_code', ['acch_code']) // Índice para filtros por código

export class Seat {
    @PrimaryColumn({ type: 'bigint', name: 'acch_id' })
    @Expose({ name: 'id' }) // Mapear a "id"
    acch_id: number;

    @Expose({ name: 'date' })
    @Column({ name: 'acch_date', type: 'date', default: () => 'CURRENT_DATE' })
    acch_date: Date;

    @Expose({ name: 'time' })
    @Column({
        type: 'time',
        name: 'acch_time',
        precision: 0,
        default: () => 'CURRENT_TIME'
    })
    @Transform(({ value }) => {
        // Si el valor tiene microsegundos (formato "08:37:28.371606"), los elimina
        if (value && typeof value === 'string') {
            return value.split('.')[0]; // Solo toma la parte antes del punto
        }
        return value;
    })
    acch_time: string;

    @PrimaryColumn({ name: 'acch_cmpy', type: 'varchar', length: 10 })
    @Expose({ name: 'cmpy' }) // Mapear a "cmpy"
    acch_cmpy: string; // Código de la empresa (varchar(10))

    @Column({ type: 'varchar', length: 190 })
    @Expose({ name: 'ware' }) // Mapear a "ware"
    acch_ware: string; // Nombre de la sucursal

    @Column()
    @Expose({ name: 'year' }) // Mapear a "year"
    acch_year: number; // Año contable

    @Column()
    @Expose({ name: 'per' }) // Mapear a "per"
    acch_per: number; // Período (1-13)

    @Column({ type: 'varchar', length: 90 })
    @Expose({ name: 'code' }) // Mapear a "code"
    acch_code: string; // Código alfanumérico único de 6 caracteres

    @Column({ type: 'varchar', length: 100, nullable: true })
    @Expose({ name: 'detbin' }) // Mapear a "detbin"
    acch_detbin: string; // Detalle o comentario del movimiento

    @Column({ name: 'acch_account', type: 'varchar', length: 20 })
    @Expose({ name: 'account' }) // Mapear a "account"
    acch_account: string; // Código de la cuenta

    @Column({ name: 'acch_account_name', type: 'varchar', length: 500 })
    @Expose({ name: 'account_name' }) // Mapear a "account_name"
    acch_account_name: string; // Detalle de la cuenta

    @Column({ name: 'acch_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
    @Expose({ name: 'debit' }) // Mapear a "debit"
    acch_debit: number; // Total débitos

    @Column({ name: 'acch_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
    @Expose({ name: 'credit' }) // Mapear a "credit"
    acch_credit: number; // Total créditos

    @Column({ name: 'acch_customers', type: 'varchar', length: 60 })
    @Expose({ name: 'customers' }) // Mapear a "customers"
    acch_customers: string; // Código del cliente/proveedor

    @Column({ name: 'acch_customers_name', type: 'varchar', length: 500 })
    @Expose({ name: 'customers_name' }) // Mapear a "customers_name"
    acch_customers_name: string; // Nombre del cliente/proveedor

    @Column({ name: 'acch_creation_by', type: 'varchar', length: 30 })
    @Expose({ name: 'creation_by' }) // Mapear a "creation_by"
    acch_creation_by: string; // Usuario que registró

    @CreateDateColumn({
        name: 'acch_creation_date',
        type: 'timestamp',
        precision: 6
    })
    @Expose({ name: 'creation_date' }) // Mapear a "creation_date"
    acch_creation_date: Date; // Fecha de creación

    @Column({ name: 'acch_updated_by', type: 'varchar', length: 30, nullable: true })
    @Expose({ name: 'updated_by' }) // Mapear a "updated_by"
    acch_updated_by: string | null; // Usuario que actualizó

    @CreateDateColumn({
        name: 'acch_updated_date',
        type: 'timestamp',
        precision: 6    
    })
    @Expose({ name: 'updated_date' }) // Mapear a "updated_date"
    acch_updated_date: Date; // Fecha de última modificación

    @BeforeInsert()
    setCurrentTime() {
        const now = new Date();
        // Formato HH:MM:SS sin microsegundos
        this.acch_time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    }
}   