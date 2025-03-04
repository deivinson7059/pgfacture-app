import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_balance' })
@Index('idx_balance_cmpy_year_per', ['accb_cmpy', 'accb_year', 'accb_per'])
@Index('idx_balance_type', ['accb_type'])
@Index('idx_balance_date_ini', ['accb_date_ini']) // Cambiado de idx_balance_date
@Index('idx_balance_date_end', ['accb_date_end']) // Nuevo índice para fecha final
@Index('idx_balance_cmpy_date_ini', ['accb_cmpy', 'accb_date_ini']) // Actualizado
@Index('idx_balance_cmpy_date_range', ['accb_cmpy', 'accb_date_ini', 'accb_date_end']) // Nuevo índice para rango completo
//Para los balances
export class Balance {
  @PrimaryColumn({ name: 'accb_cmpy', type: 'varchar', length: 10 })
  @Expose({ name: 'cmpy' })
  accb_cmpy: string;

  @PrimaryColumn({ name: 'accb_year', type: 'int' })
  @Expose({ name: 'year' })
  accb_year: number;

  @PrimaryColumn({ name: 'accb_per', type: 'int' })
  @Expose({ name: 'per' })
  accb_per: number;

  @PrimaryColumn({ name: 'accb_type', type: 'char', length: 1 })
  @Expose({ name: 'type' })
  accb_type: string; // 'G' = General, 'P' = Prueba (Trial), 'S' = Situación (Balance Sheet), 'R' = Resultados (Income Statement)

  @PrimaryColumn({ name: 'accb_date_ini', type: 'date', default: () => 'CURRENT_DATE' }) // Renombrado de accb_date
  @Expose({ name: 'date_ini' })
  accb_date_ini: Date; // Fecha inicial del rango

  @Column({ name: 'accb_date_end', type: 'date', default: () => 'CURRENT_DATE' }) // Nuevo campo para fecha final
  @Expose({ name: 'date_end' })
  accb_date_end: Date; // Fecha final del rango
  
  @Column({ name: 'accb_date_generated', type: 'timestamp', transformer: dateTransformer() })
  @Expose({ name: 'date_generated' })
  accb_date_generated: Date;

  @Column({ name: 'accb_generated_by', type: 'varchar', length: 30 })
  @Expose({ name: 'generated_by' })
  accb_generated_by: string;

  @Column({ name: 'accb_is_closing_balance', type: 'boolean', default: false })
  @Expose({ name: 'is_closing_balance' })
  accb_is_closing_balance: boolean;

  @Column({ name: 'accb_status', type: 'char', length: 1, default: 'A' })
  @Expose({ name: 'status' })
  accb_status: string; // 'A' = Active, 'I' = Inactive

  @Column({ name: 'accb_activo_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'activo_total' })
  accb_activo_total: number;

  @Column({ name: 'accb_pasivo_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'pasivo_total' })
  accb_pasivo_total: number;

  @Column({ name: 'accb_patrimonio_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'patrimonio_total' })
  accb_patrimonio_total: number;

  @Column({ name: 'accb_ingresos_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'ingresos_total' })
  accb_ingresos_total: number;

  @Column({ name: 'accb_gastos_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'gastos_total' })
  accb_gastos_total: number;

  @Column({ name: 'accb_costos_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'costos_total' })
  accb_costos_total: number;

  @Column({ name: 'accb_utilidad_perdida', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'utilidad_perdida' })
  accb_utilidad_perdida: number;

  @Column({ name: 'accb_observaciones', type: 'text', nullable: true })
  @Expose({ name: 'observaciones' })
  accb_observaciones: string | null;

  @CreateDateColumn({
    name: 'accb_creation_date',
    type: 'timestamp',
    precision: 6
  })
  @Expose({ name: 'creation_date' })
  accb_creation_date: Date;
}