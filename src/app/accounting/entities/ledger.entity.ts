import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_ledger' })
@Index('idx_ledger_cmpy_year_per', ['accl_cmpy', 'accl_year', 'accl_per'])
@Index('idx_ledger_account', ['accl_account'])
@Index('idx_ledger_date', ['accl_date']) // Nuevo índice por fecha
@Index('idx_ledger_cmpy_date', ['accl_cmpy', 'accl_date']) // Nuevo índice por compañía y fecha
@Index('idx_ledger_cmpy_account_date', ['accl_cmpy', 'accl_account', 'accl_date']) // Índice para búsquedas específicas
// Para el libro mayor
export class Ledger {
  @PrimaryColumn({ name: 'accl_cmpy', type: 'varchar', length: 10 })
  @Expose({ name: 'cmpy' })
  accl_cmpy: string;

  @PrimaryColumn({ name: 'accl_ware', type: 'varchar', length: 190 })
  @Expose({ name: 'ware' })
  accl_ware: string;

  @PrimaryColumn({ name: 'accl_year', type: 'int' })
  @Expose({ name: 'year' })
  accl_year: number;

  @PrimaryColumn({ name: 'accl_per', type: 'int' })
  @Expose({ name: 'per' })
  accl_per: number;

  @PrimaryColumn({ name: 'accl_account', type: 'varchar', length: 20 })
  @Expose({ name: 'account' })
  accl_account: string;

  @PrimaryColumn({ name: 'accl_date', type: 'date', default: () => 'CURRENT_DATE' }) // Nuevo campo fecha como parte de la clave primaria
  @Expose({ name: 'date' })
  accl_date: Date;

  @Column({ name: 'accl_account_name', type: 'varchar', length: 500 })
  @Expose({ name: 'account_name' })
  accl_account_name: string;

  // Saldo inicial del día
  @Column({ name: 'accl_initial_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'initial_debit' })
  accl_initial_debit: number;

  @Column({ name: 'accl_initial_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'initial_credit' })
  accl_initial_credit: number;

  // Movimientos del día
  @Column({ name: 'accl_day_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'day_debit' })
  accl_day_debit: number;

  @Column({ name: 'accl_day_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'day_credit' })
  accl_day_credit: number;

  // Movimientos acumulados del período
  @Column({ name: 'accl_period_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'period_debit' })
  accl_period_debit: number;

  @Column({ name: 'accl_period_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'period_credit' })
  accl_period_credit: number;

  // Saldo final (inicial + movimientos del día)
  @Column({ name: 'accl_final_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'final_debit' })
  accl_final_debit: number;

  @Column({ name: 'accl_final_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'final_credit' })
  accl_final_credit: number;

  @Column({ name: 'accl_last_updated', type: 'timestamp', transformer: dateTransformer() })
  @Expose({ name: 'last_updated' })
  accl_last_updated: Date;

  @Column({ name: 'accl_creation_by', type: 'varchar', length: 30 })
  @Expose({ name: 'creation_by' })
  accl_creation_by: string;

  @CreateDateColumn({
    name: 'accl_creation_date',
    type: 'timestamp',
    precision: 6,
    transformer: dateTransformer(),
  })
  @Expose({ name: 'creation_date' })
  accl_creation_date: Date;

  @Column({ name: 'accl_updated_by', type: 'varchar', length: 30, nullable: true })
  @Expose({ name: 'updated_by' })
  accl_updated_by: string | null;

  @UpdateDateColumn({
    name: 'accl_updated_date',
    type: 'timestamp',
    precision: 6,
    transformer: dateTransformer(),
  })
  @Expose({ name: 'updated_date' })
  accl_updated_date: Date;
}