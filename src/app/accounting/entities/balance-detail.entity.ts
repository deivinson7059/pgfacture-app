import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_balance_detail' })
@Index('idx_balance_detail_cmpy_year_per', ['acbd_cmpy', 'acbd_year', 'acbd_per', 'acbd_type'])
@Index('idx_balance_detail_account', ['acbd_account'])
@Index('idx_balance_detail_level', ['acbd_level'])

//Para los detalles de balances
export class BalanceDetail {
  @PrimaryColumn({ name: 'acbd_cmpy', type: 'varchar', length: 10 })
  @Expose({ name: 'cmpy' })
  acbd_cmpy: string;

  @PrimaryColumn({ name: 'acbd_year', type: 'int' })
  @Expose({ name: 'year' })
  acbd_year: number;

  @PrimaryColumn({ name: 'acbd_per', type: 'int' })
  @Expose({ name: 'per' })
  acbd_per: number;

  @PrimaryColumn({ name: 'acbd_type', type: 'char', length: 1 })
  @Expose({ name: 'type' })
  acbd_type: string; // 'G' = General, 'P' = Prueba, 'S' = Situación, 'R' = Resultados

  @PrimaryColumn({ name: 'acbd_account', type: 'varchar', length: 20 })
  @Expose({ name: 'account' })
  acbd_account: string;

  @Column({ name: 'acbd_account_name', type: 'varchar', length: 500 })
  @Expose({ name: 'account_name' })
  acbd_account_name: string;

  @Column({ name: 'acbd_level', type: 'int', default: 1 })
  @Expose({ name: 'level' })
  acbd_level: number;

  @Column({ name: 'acbd_parent_account', type: 'varchar', length: 20, nullable: true })
  @Expose({ name: 'parent_account' })
  acbd_parent_account: string | null;

  @Column({ name: 'acbd_is_total_row', type: 'boolean', default: false })
  @Expose({ name: 'is_total_row' })
  acbd_is_total_row: boolean;

  @Column({ name: 'acbd_order', type: 'int', default: 0 })
  @Expose({ name: 'order' })
  acbd_order: number;

  @Column({ name: 'acbd_initial_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'initial_debit' })
  acbd_initial_debit: number;

  @Column({ name: 'acbd_initial_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'initial_credit' })
  acbd_initial_credit: number;

  @Column({ name: 'acbd_period_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'period_debit' })
  acbd_period_debit: number;

  @Column({ name: 'acbd_period_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'period_credit' })
  acbd_period_credit: number;

  @Column({ name: 'acbd_final_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'final_debit' })
  acbd_final_debit: number;

  @Column({ name: 'acbd_final_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'final_credit' })
  acbd_final_credit: number;

  @Column({ name: 'acbd_balance', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'balance' })
  acbd_balance: number;
}