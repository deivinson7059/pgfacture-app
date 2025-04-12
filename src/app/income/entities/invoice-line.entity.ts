import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';
@Entity({ schema: 'pgfacture', name: 'pgx_invline' })
export class InvoiceLine {
    @Expose({ name: 'id' })
    @PrimaryColumn({ type: 'bigint', name: 'il_id' })
    il_id: number;

    @Expose({ name: 'ih_id' })
    @Column({ type: 'bigint', name: 'il_ih_id' })
    il_ih_id: number;

    @Expose({ name: 'cmpy' })
    @Column({ type: 'varchar', length: 5, name: 'il_cmpy' })
    il_cmpy: string;

    @Expose({ name: 'ware' })
    @Column({ type: 'varchar', length: 200, name: 'il_ware' })
    il_ware: string;

    @Expose({ name: 'seri' })
    @Column({ type: 'int', default: 0, name: 'il_seri' })
    il_seri: number;

    @Expose({ name: 'prefix' })
    @Column({ type: 'varchar', length: 21, nullable: true, name: 'il_prefix' })
    il_prefix: string;

    @Expose({ name: 'cons' })
    @Column({ type: 'int', name: 'il_cons' })
    il_cons: number;

    @Expose({ name: 'number' })
    @Column({ type: 'varchar', length: 200, name: 'il_number' })
    il_number: string;

    @Expose({ name: 'cust_id' })
    @Column({ type: 'varchar', length: 30, name: 'il_cust_id' })
    il_cust_id: string;

    @Expose({ name: 'line' })
    @Column({ type: 'int', name: 'il_line' })
    il_line: number;

    @Expose({ name: 'prod_type' })
    @Column({ type: 'varchar', length: 20, nullable: true, name: 'il_prod_type' })
    il_prod_type: string;

    @Expose({ name: 'code_bar' })
    @Column({ type: 'varchar', length: 200, nullable: true, name: 'il_code_bar' })
    il_code_bar: string;

    @Expose({ name: 'code' })
    @Column({ type: 'varchar', length: 120, nullable: true, name: 'il_code' })
    il_code: string;

    @Expose({ name: 'description' })
    @Column({ type: 'varchar', length: 300, nullable: true, name: 'il_description' })
    il_description: string;

    @Expose({ name: 'cost_uni' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'il_cost_uni' })
    il_cost_uni: number;

    @Expose({ name: 'list_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'il_list_amount' })
    il_list_amount: number;

    @Expose({ name: 'disc_id' })
    @Column({ type: 'int', name: 'il_disc_id' })
    il_disc_id: number;

    @Expose({ name: 'disc_percent' })
    @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'il_disc_percent' })
    il_disc_percent: number;

    @Expose({ name: 'disc_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'il_disc_amount' })
    il_disc_amount: number;

    @Expose({ name: 'tax_id' })
    @Column({ type: 'int', name: 'il_tax_id' })
    il_tax_id: number;

    @Expose({ name: 'tax_percent' })
    @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'il_tax_percent' })
    il_tax_percent: number;

    @Expose({ name: 'tax_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'il_tax_amount' })
    il_tax_amount: number;

    @Expose({ name: 'amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'il_amount' })
    il_amount: number;

    @Expose({ name: 'profit' })
    @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'il_profit' })
    il_profit: number;

    @Expose({ name: 'create_ucid' })
    @Column({ type: 'varchar', length: 200, nullable: true, name: 'il_create_ucid' })
    il_create_ucid: string;

    @Expose({ name: 'create_date' })
    @CreateDateColumn({
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer(),
        name: 'il_create_date'
    })
    il_create_date: Date;

    @Expose({ name: 'update_ucid' })
    @Column({ type: 'varchar', length: 200, nullable: true, default: '', name: 'il_update_ucid' })
    il_update_ucid?: string;

    @Expose({ name: 'update_date' })
    @UpdateDateColumn({
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer(),
        name: 'il_update_date',
        nullable: true,
        default: null
    })
    il_update_date?: Date
}