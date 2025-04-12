import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';
@Entity({ schema: 'pgfacture', name: 'pgx_invhead' })
export class InvoiceHead {
    @Expose({ name: 'id' })
    @PrimaryColumn({ type: 'bigint', name: 'ih_id' })
    ih_id: number;

    @Expose({ name: 'cmpy' })
    @PrimaryColumn({ type: 'varchar', length: 10, name: 'ih_cmpy' })
    ih_cmpy: string;

    @Expose({ name: 'cmpy_name' })
    @Column({ type: 'varchar', length: 300, nullable: true, name: 'ih_cmpy_name' })
    ih_cmpy_name: string;

    @Expose({ name: 'cmpy_address' })
    @Column({ type: 'varchar', length: 300, nullable: true, name: 'ih_cmpy_address' })
    ih_cmpy_address: string;

    @Expose({ name: 'cmpy_phone' })
    @Column({ type: 'varchar', length: 150, nullable: true, name: 'ih_cmpy_phone' })
    ih_cmpy_phone: string;

    @Expose({ name: 'cmpy_municipality' })
    @Column({ type: 'int', nullable: true, name: 'ih_cmpy_municipality' })
    ih_cmpy_municipality: number;

    @Expose({ name: 'cmpy_email' })
    @Column({ type: 'varchar', length: 200, nullable: true, name: 'ih_cmpy_email' })
    ih_cmpy_email: string;

    @Expose({ name: 'sucid' })
    @Column({ type: 'int', name: 'ih_sucid' })
    ih_sucid: number;

    @Expose({ name: 'suc_name' })
    @Column({ type: 'varchar', length: 200, name: 'ih_suc_name' })
    ih_suc_name: string;

    @Expose({ name: 'suc_address' })
    @Column({ type: 'varchar', length: 300, nullable: true, name: 'ih_suc_address' })
    ih_suc_address: string;

    @Expose({ name: 'suc_email' })
    @Column({ type: 'varchar', length: 150, nullable: true, name: 'ih_suc_email' })
    ih_suc_email: string;

    @Expose({ name: 'suc_phone' })
    @Column({ type: 'varchar', length: 150, nullable: true, name: 'ih_suc_phone' })
    ih_suc_phone: string;

    @Expose({ name: 'suc_municipality' })
    @Column({ type: 'int', nullable: true, name: 'ih_suc_municipality' })
    ih_suc_municipality: number;

    @Expose({ name: 'type' })
    @Column({ type: 'varchar', length: 60, default: 'FACTURA', name: 'ih_type' })
    ih_type: string;

    @Expose({ name: 'is_el' })
    @Column({ type: 'varchar', length: 2, default: 'N', name: 'ih_is_el' })
    ih_is_el: string;

    @Expose({ name: 'seri' })
    @Column({ type: 'int', default: 0, name: 'ih_seri' })
    ih_seri: number;

    @Expose({ name: 'prefix' })
    @Column({ type: 'varchar', length: 21, nullable: true, name: 'ih_prefix' })
    ih_prefix: string;

    @Expose({ name: 'cons' })
    @Column({ type: 'int', name: 'ih_cons' })
    ih_cons: number;

    @Expose({ name: 'number' })
    @Column({ type: 'varchar', length: 200, name: 'ih_number' })
    ih_number: string;

    @Expose({ name: 'resolution_number' })
    @Column({ type: 'varchar', length: 80, default: '-', name: 'ih_resolution_number' })
    ih_resolution_number: string;

    @Expose({ name: 'seze' })
    @Column({ type: 'varchar', length: 20, nullable: true, name: 'ih_seze' })
    ih_seze?: string;

    @Expose({ name: 'type_document_id' })
    @Column({ type: 'int', default: 1, name: 'ih_type_document_id' })
    ih_type_document_id: number;

    @Expose({ name: 'term' })
    @Column({ type: 'int', default: 0, name: 'ih_term' })
    ih_term: number;

    @Expose({ name: 'date' })
    @Column({ name: 'ih_date', type: 'date', default: () => 'CURRENT_DATE' })
    ih_date: Date;

    @Expose({ name: 'date_end' })
    @Column({ name: 'ih_date_end', type: 'date', default: () => 'CURRENT_DATE' })
    ih_date_end: Date;

    @Expose({ name: 'year' })
    @Column({ type: 'int', default: 0, name: 'ih_year' })
    ih_year: number;

    @Expose({ name: 'month' })
    @Column({ type: 'varchar', length: 10, nullable: true, name: 'ih_month' })
    ih_month: string;

    @Expose({ name: 'time' })
    @Column({ type: 'varchar', length: 10, nullable: true, name: 'ih_time' })
    ih_time: string;

    @Expose({ name: 'cust_id' })
    @Column({ type: 'bigint', nullable: true, name: 'ih_cust_id' })
    ih_cust_id?: number;

    @Expose({ name: 'cust_identification_number' })
    @Column({ type: 'varchar', length: 30, name: 'ih_cust_identification_number' })
    ih_cust_identification_number: string;

    @Expose({ name: 'cust_name' })
    @Column({ type: 'varchar', length: 120, nullable: true, name: 'ih_cust_name' })
    ih_cust_name: string;

    @Expose({ name: 'lines' })
    @Column({ type: 'int', name: 'ih_lines', default: 0 })
    ih_lines?: number;

    @Expose({ name: 'line_extension_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'ih_line_extension_amount' })
    ih_line_extension_amount?: number;

    @Expose({ name: 'tax_exclusive_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'ih_tax_exclusive_amount' })
    ih_tax_exclusive_amount?: number;

    @Expose({ name: 'tax_inclusive_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'ih_tax_inclusive_amount' })
    ih_tax_inclusive_amount?: number;

    @Expose({ name: 'tax_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'ih_tax_amount' })
    ih_tax_amount?: number;

    @Expose({ name: 'dis_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'ih_dis_amount' })
    ih_dis_amount?: number;

    @Expose({ name: 'total_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'ih_total_amount' })
    ih_total_amount?: number;

    @Expose({ name: 'payable_amount' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'ih_payable_amount' })
    ih_payable_amount?: number;

    @Expose({ name: 'cust_paid_total' })
    @Column({ type: 'decimal', precision: 20, scale: 5, default: 0, name: 'ih_cust_paid_total' })
    ih_cust_paid_total?: number;

    @Expose({ name: 'paid_pos' })
    @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'ih_paid_pos' })
    ih_paid_pos?: number;

    @Expose({ name: 'paid_turns' })
    @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'ih_paid_turns' })
    ih_paid_turns?: number;

    @Expose({ name: 'paid_ref' })
    @Column({ type: 'varchar', length: 250, nullable: true, name: 'ih_paid_ref' })
    ih_paid_ref?: string;

    @Expose({ name: 'paid_cta' })
    @Column({ type: 'varchar', length: 250, nullable: true, name: 'ih_paid_cta' })
    ih_paid_cta?: string;

    @Expose({ name: 'create_ucid' })
    @Column({ type: 'varchar', length: 200, nullable: true, name: 'ih_create_ucid' })
    ih_create_ucid: string;

    @Expose({ name: 'disable_confirmation_text' })
    @Column({ type: 'boolean', default: false, name: 'ih_disable_confirmation_text' })
    ih_disable_confirmation_text?: boolean;

    @Expose({ name: 'create_date' })
    @CreateDateColumn({ name: 'ih_create_date' })
    ih_create_date: Date;

    @Expose({ name: 'update_ucid' })
    @Column({ type: 'varchar', length: 200, nullable: true, name: 'ih_update_ucid' })
    ih_update_ucid?: string;

    @Expose({ name: 'update_date' })
    @UpdateDateColumn({
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer(),
        name: 'ih_update_date',
        nullable: true,
        default: null
    })
    ih_update_date?: Date;
}