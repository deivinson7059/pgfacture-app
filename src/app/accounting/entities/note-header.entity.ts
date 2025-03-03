// src/app/accounting/entities/note-header.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, Index } from 'typeorm';
import { Expose, Transform } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';
import { NoteLine } from '.';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_note_header' })
@Index('idx_accounting_note_cmpy', ['acnh_cmpy'])
@Index('idx_accounting_note_code', ['acnh_code'])
//notas contables header
export class NoteHeader {
  @PrimaryGeneratedColumn('uuid', { name: 'acnh_id' })
  @Expose({ name: 'id' })
  acnh_id: string;

  @Column({ name: 'acnh_code', type: 'varchar', length: 20, unique: true })
  @Expose({ name: 'code' })
  acnh_code: string;

  @Column({ name: 'acnh_cmpy', type: 'varchar', length: 10 })
  @Expose({ name: 'cmpy' })
  acnh_cmpy: string;

  @Column({ name: 'acnh_ware', type: 'varchar', length: 190 })
  @Expose({ name: 'ware' })
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

  @Column({ name: 'acnh_description', type: 'varchar', length: 500, nullable: true })
  @Expose({ name: 'description' })
  acnh_description: string;

  @Column({ name: 'acnh_status', type: 'char', length: 1, default: 'P' })
  @Expose({ name: 'status' })
  acnh_status: string; // P: Pendiente, A: Aprobado, R: Rechazado, C: Contabilizado

  @Column({ name: 'acnh_total_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'total_debit' })
  acnh_total_debit: number;

  @Column({ name: 'acnh_total_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'total_credit' })
  acnh_total_credit: number;

  @Column({ name: 'acnh_reference', type: 'varchar', length: 100, nullable: true })
  @Expose({ name: 'reference' })
  acnh_reference: string;

  @Column({ name: 'acnh_creation_by', type: 'varchar', length: 30 })
  @Expose({ name: 'creation_by' })
  acnh_creation_by: string;

  @CreateDateColumn({
    name: 'acnh_creation_date',
    type: 'timestamp',
    precision: 6,
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
  })
  @Expose({ name: 'updated_date' })
  acnh_updated_date: Date;

  @Column({ name: 'acnh_approved_by', type: 'varchar', length: 30, nullable: true })
  @Expose({ name: 'approved_by' })
  acnh_approved_by: string;

  @Column({ 
    name: 'acnh_approved_date', 
    type: 'timestamp', 
    nullable: true, 
  })
  @Expose({ name: 'approved_date' })
  acnh_approved_date: Date;

  // No necesitamos un campo adicional para la oficina, usamos acnh_ware

  @OneToMany(() => NoteLine, line => line.header)
  @JoinColumn({ name: 'acnh_id' })
  lines: NoteLine[];
}