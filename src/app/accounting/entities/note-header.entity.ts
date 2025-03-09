import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, Index, PrimaryColumn } from 'typeorm';
import { Expose, Transform } from 'class-transformer';
import { formatDecimal } from 'src/app/common/utils/transform';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_note_header' })
//notas contables header
export class NoteHeader {
    @Column({ name: 'acnh_id', type: 'bigint' })
    @PrimaryColumn({ name: 'acnh_id' })
    @Expose({ name: 'id' })
    acnh_id: number;

    @PrimaryColumn({ name: 'acnh_cmpy', type: 'varchar', length: 10 })
    @Expose({ name: 'cmpy' })
    @Index('accounting_note_cmpy_fk1')
    acnh_cmpy: string;

    @Column({ name: 'acnh_ware', type: 'varchar', length: 190 })
    @Expose({ name: 'ware' })
    @Index('accounting_note_ware_fk2')
    acnh_ware: string;

    @Column({ name: 'acnh_year', type: 'int' })
    @Expose({ name: 'year' })
    acnh_year: number;

    @Column({ name: 'acnh_per', type: 'int' })
    @Expose({ name: 'per' })
    acnh_per: number;

    @Column({ name: 'acnh_date', type: 'date', default: () => 'CURRENT_DATE' })
    @Expose({ name: 'date' })
    acnh_date: Date;

    @Column({ type: 'time', name: 'acnh_time', precision: 0, default: () => 'CURRENT_TIME' })
    @Transform(({ value }) => {
        if (value && typeof value === 'string') {
            return value.split('.')[0];
        }
        return value;
    })
    @Expose({ name: 'time' })
    acnh_time: string;

    @Column({ name: 'acnh_customer', type: 'varchar', length: 60, default: '-' })
    @Expose({ name: 'customer' })
    acnh_customer: string;

    @Column({ name: 'acnh_customer_name', type: 'varchar', length: 200, default: '--' })
    @Expose({ name: 'customer_name' })
    acnh_customer_name: string;

    @Column({ name: 'acnh_description', type: 'varchar', length: 500, default: '' })
    @Expose({ name: 'description' })
    acnh_description: string;

    @Column({ name: 'acnh_status', type: 'char', length: 1, default: 'P' })
    @Expose({ name: 'status' })
    acnh_status: string; // P: Pendiente, A: Aprobado, R: Rechazado, C: Contabilizado

    @Column({ name: 'acnh_total_debit', type: 'decimal', precision: 30, scale: 5, default: 0 })
    @Expose({ name: 'total_debit' })
    @Transform(formatDecimal(2), { toPlainOnly: true })
    acnh_total_debit: number;

    @Column({ name: 'acnh_total_credit', type: 'decimal', precision: 30, scale: 5, default: 0 })
    @Expose({ name: 'total_credit' })
    @Transform(formatDecimal(2), { toPlainOnly: true })
    acnh_total_credit: number;

    @Column({ name: 'acnh_reference', type: 'varchar', length: 190, nullable: true })
    @Expose({ name: 'reference' })
    acnh_reference: string;

    @Column({ name: 'acnh_ccosto', type: 'varchar', length: 20, nullable: true })
    @Expose({ name: 'ccosto' })
    acnh_ccosto?: string;

    @Column({ name: 'acnh_creation_by', type: 'varchar', length: 30 })
    @Expose({ name: 'creation_by' })
    acnh_creation_by: string;

    @CreateDateColumn({
        name: 'acnh_creation_date',
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer()
    })

    @Expose({ name: 'creation_date' })
    acnh_creation_date: Date;

    @Column({ name: 'acnh_updated_by', type: 'varchar', length: 30, nullable: true })
    @Expose({ name: 'updated_by' })
    acnh_updated_by: string;

    @UpdateDateColumn({
        name: 'acnh_updated_date',
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer()
    })
    @Expose({ name: 'updated_date' })
    acnh_updated_date: Date;

    @Column({ name: 'acnh_approved_by', type: 'varchar', length: 30, nullable: true })
    @Expose({ name: 'approved_by' })
    acnh_approved_by: string;

    @Column({
        name: 'acnh_approved_date',
        type: 'timestamp',
        precision: 6,
        nullable: true,
        transformer: dateTransformer()
    })
    @Expose({ name: 'approved_date' })
    acnh_approved_date: Date;

    // Nuevos campos añadidos
    @Column({ name: 'acnh_observations', type: 'text', nullable: true })
    @Expose({ name: 'observations' })
    acnh_observations: string | null;

    @Column({ name: 'acnh_external_reference', type: 'varchar', length: 190, nullable: true })
    @Expose({ name: 'external_reference' })
    acnh_external_reference: string | null;

    @Column({ name: 'acnh_doc_type', type: 'varchar', length: 50, nullable: true })
    @Expose({ name: 'doc_type' })
    acnh_doc_type: string | null;

    @Column({ name: 'acnh_area', type: 'varchar', length: 50, nullable: true })
    @Expose({ name: 'area' })
    acnh_area: string | null;

    @Column({ name: 'acnh_priority', type: 'char', length: 1, default: 'N' })
    @Expose({ name: 'priority' })
    acnh_priority: string; // A: Alta, M: Media, N: Normal, B: Baja

    @Column({ name: 'acnh_auto_accounting', type: 'boolean', default: false })
    @Expose({ name: 'auto_accounting' })
    acnh_auto_accounting: boolean; 

    @Column({ name: 'acnh_accounting_date', type: 'date', nullable: true })
    @Expose({ name: 'accounting_date' })
    acnh_accounting_date: Date | null;
}