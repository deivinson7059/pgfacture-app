import { Entity, Column, PrimaryColumn, Index, CreateDateColumn, } from 'typeorm';
import { Expose, Transform } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';
import { formatDecimal } from 'src/app/common/utils/transform';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_note_line' })
//notas contables lineas
export class NoteLine {

    @Column({ name: 'acnl_id', type: 'bigint' })
    @PrimaryColumn({ name: 'acnl_id' })
    @Expose({ name: 'id' })
    acnl_id: number;

    @Column({ name: 'acnl_acnh_id', type: 'bigint' })
    @Expose({ name: 'acnh_id' })
    @Index('accounting_note_line_fk0')
    acnl_acnh_id: number;

    @Column({ name: 'acnl_cmpy', type: 'varchar', length: 10 })
    @Expose({ name: 'cmpy' })
    @Index('accounting_note_line_fk1')
    acnl_cmpy: string;

    @Column({ name: 'acnl_ware', type: 'varchar', length: 190 })
    @Expose({ name: 'ware' })
    @Index('accounting_note_line_fk2')
    acnl_ware: string;

    @Column({ name: 'acnl_line_number', type: 'int' })
    @Expose({ name: 'line_number' })
    acnl_line_number: number;

    @Column({ name: 'acnl_account', type: 'varchar', length: 20 })
    @Expose({ name: 'account' })
    @Index('accounting_note_line_fk3')
    acnl_account: string;

    @Column({ name: 'acnl_account_name', type: 'varchar', length: 500 })
    @Expose({ name: 'account_name' })
    acnl_account_name: string;

    @Column({ name: 'acnl_debit', type: 'decimal', precision: 15, scale: 2, nullable: true })
    @Expose({ name: 'debit' })
    @Transform(formatDecimal(2), { toPlainOnly: true })
    acnl_debit: number | null;

    @Column({ name: 'acnl_credit', type: 'decimal', precision: 15, scale: 2, nullable: true })
    @Expose({ name: 'credit' })
    @Transform(formatDecimal(2), { toPlainOnly: true })
    acnl_credit: number | null;

    @Column({ name: 'acnl_taxable_base', type: 'decimal', precision: 30, scale: 5, nullable: true })
    @Expose({ name: 'taxable_base' })
    @Transform(formatDecimal(2), { toPlainOnly: true })
    acnl_taxable_base: number | null;

    @Column({ name: 'acnl_exempt_base', type: 'decimal', precision: 30, scale: 5, nullable: true })
    @Expose({ name: 'exempt_base' })
    @Transform(formatDecimal(2), { toPlainOnly: true })
    acnl_exempt_base: number | null;

    @Column({ name: 'acnl_customers', type: 'varchar', length: 190, nullable: true })
    @Expose({ name: 'customers' })
    acnl_customers: string;

    @Column({ name: 'acnl_customers_name', type: 'varchar', length: 500, nullable: true })
    @Expose({ name: 'customers_name' }) // Mapear a "customers_name"
    acnl_customers_name: string | null; // Nombre del cliente/proveedor    

    @Column({ name: 'acnl_creation_by', type: 'varchar', length: 30 })
    @Expose({ name: 'creation_by' })
    acnl_creation_by: string;

    @CreateDateColumn({
        name: 'acnl_creation_date',
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer(),
    })
    @Expose({ name: 'creation_date' })
    acnl_creation_date: Date;
}