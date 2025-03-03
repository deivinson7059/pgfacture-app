import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { Expose, Transform } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_journal' })
@Index('idx_journal_cmpy_year_per', ['accj_cmpy', 'accj_year', 'accj_per'])
@Index('idx_journal_date', ['accj_date'])
@Index('idx_journal_code', ['accj_code'])
@Index('idx_journal_account', ['accj_account'])
@Index('idx_journal_cmpy_date', ['accj_cmpy', 'accj_date']) // Nuevo índice por compañía y fecha
//Para el libro diario
export class Journal {
  @PrimaryColumn({ name: 'accj_id', type: 'bigint' })
  @Expose({ name: 'id' })
  accj_id: number;

  @PrimaryColumn({ name: 'accj_cmpy', type: 'varchar', length: 10 })
  @Expose({ name: 'cmpy' })
  accj_cmpy: string;

  @PrimaryColumn({ name: 'accj_line_number', type: 'int' })
  @Expose({ name: 'line_number' })
  accj_line_number: number;

  @Column({ name: 'accj_date', type: 'date', default: () => 'CURRENT_DATE' })
  @Expose({ name: 'date' })
  accj_date: Date;

  @Column({
    type: 'time',
    name: 'accj_time',
    precision: 0,
    default: () => 'CURRENT_TIME'
  })
  @Transform(({ value }) => {
    if (value && typeof value === 'string') {
      return value.split('.')[0]; // Solo toma la parte antes del punto
    }
    return value;
  })
  @Expose({ name: 'time' })
  accj_time: string;

  @Column({ name: 'accj_ware', type: 'varchar', length: 190 })
  @Expose({ name: 'ware' })
  accj_ware: string;

  @Column({ name: 'accj_year', type: 'int' })
  @Expose({ name: 'year' })
  accj_year: number;

  @Column({ name: 'accj_per', type: 'int' })
  @Expose({ name: 'per' })
  accj_per: number;

  @Column({ name: 'accj_code', type: 'varchar', length: 90 })
  @Expose({ name: 'code' })
  accj_code: string;

  @Column({ name: 'accj_account', type: 'varchar', length: 20 })
  @Expose({ name: 'account' })
  accj_account: string;

  @Column({ name: 'accj_account_name', type: 'varchar', length: 500 })
  @Expose({ name: 'account_name' })
  accj_account_name: string;

  @Column({ name: 'accj_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'debit' })
  accj_debit: number;

  @Column({ name: 'accj_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'credit' })
  accj_credit: number;

  @Column({ name: 'accj_detbin', type: 'varchar', length: 100, nullable: true })
  @Expose({ name: 'detbin' })
  accj_detbin: string | null;

  @Column({ name: 'accj_documents_ref', type: 'varchar', length: 100, nullable: true })
  @Expose({ name: 'documents_ref' })
  accj_documents_ref: string | null;

  @Column({ name: 'accj_customers', type: 'varchar', length: 60 })
  @Expose({ name: 'customers' })
  accj_customers: string;

  @Column({ name: 'accj_customers_name', type: 'varchar', length: 500 })
  @Expose({ name: 'customers_name' })
  accj_customers_name: string;

  @Column({ name: 'accj_creation_by', type: 'varchar', length: 30 })
  @Expose({ name: 'creation_by' })
  accj_creation_by: string;

  @CreateDateColumn({
    name: 'accj_creation_date',
    type: 'timestamp',
    precision: 6,
    transformer: dateTransformer(),
  })
  @Expose({ name: 'creation_date' })
  accj_creation_date: Date;

  @Column({ name: 'accj_is_closing_entry', type: 'boolean', default: false })
  @Expose({ name: 'is_closing_entry' })
  accj_is_closing_entry: boolean;
}