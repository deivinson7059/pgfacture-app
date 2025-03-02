import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_period' })
@Index('idx_accounting_period_cmpy_year', ['accp_cmpy', 'accp_year'])
@Index('idx_accounting_period_status', ['accp_status'])
//Para los períodos contables
export class Period {
  @PrimaryColumn({ name: 'accp_cmpy', type: 'varchar', length: 10 })
  @Expose({ name: 'cmpy' })
  accp_cmpy: string;

  @PrimaryColumn({ name: 'accp_year', type: 'int' })
  @Expose({ name: 'year' })
  accp_year: number;

  @PrimaryColumn({ name: 'accp_per', type: 'int' })
  @Expose({ name: 'per' })
  accp_per: number;

  @Column({ name: 'accp_description', type: 'varchar', length: 100 })
  @Expose({ name: 'description' })
  accp_description: string;

  @Column({ name: 'accp_start_date', type: 'date' })
  @Expose({ name: 'start_date' })
  accp_start_date: Date;

  @Column({ name: 'accp_end_date', type: 'date' })
  @Expose({ name: 'end_date' })
  accp_end_date: Date;

  @Column({ name: 'accp_status', type: 'char', length: 1, default: 'O' })
  @Expose({ name: 'status' })
  accp_status: string; // 'O' = Open, 'C' = Closed, 'P' = Processing

  @Column({ name: 'accp_is_closing_period', type: 'boolean', default: false })
  @Expose({ name: 'is_closing_period' })
  accp_is_closing_period: boolean; // Para el período 13 (cierre anual)

  @Column({ name: 'accp_closed_by', type: 'varchar', length: 30, nullable: true })
  @Expose({ name: 'closed_by' })
  accp_closed_by: string | null;

  @Column({ 
    name: 'accp_closed_date', 
    type: 'timestamp', 
    nullable: true, 
    transformer: dateTransformer() 
})
  @Expose({ name: 'closed_date' })
  accp_closed_date: Date | null;

  @Column({ name: 'accp_creation_by', type: 'varchar', length: 30 })
  @Expose({ name: 'creation_by' })
  accp_creation_by: string;

  @CreateDateColumn({
    name: 'accp_creation_date',
    type: 'timestamp',
    precision: 6,
    transformer: dateTransformer(),
  })
  @Expose({ name: 'creation_date' })
  accp_creation_date: Date;

  @Column({ name: 'accp_updated_by', type: 'varchar', length: 30, nullable: true })
  @Expose({ name: 'updated_by' })
  accp_updated_by: string | null;

  @UpdateDateColumn({
    name: 'accp_updated_date',
    type: 'timestamp',
    precision: 6,
    transformer: dateTransformer(),
  })
  @Expose({ name: 'updated_date' })
  accp_updated_date: Date;
}