import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TaskAction, TaskFrequency, TaskMethod, TaskStatus, TaskType } from '../interfaces/task-settings.interface';


@Entity({ schema: 'pgfacture', name: 'pg_task_settings' })
export class TaskSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: TaskType
    })
    type: TaskType; // 'cron' or 'api'

    @Column({ nullable: true })
    endpoint?: string;

    @Column({ type: 'jsonb', nullable: true })
    headers?: object;

    @Column({
        nullable: true,
        type: 'enum',
        enum: TaskMethod
    })
    method?: TaskMethod; // 'GET' or 'POST'

    @Column({ type: 'jsonb', nullable: true })
    data?: object;

    @Column({ nullable: true })
    subject?: string;

    @Column()
    schedule: string; // Cron expression

    @Column({
        type: 'enum',
        enum: TaskFrequency
    })
    frequency: TaskFrequency; // Only specific values allowed

    @Column()
    execution_time: string; // Only specific hour values allowed (HH:00)

    
    @Column({
        type: 'enum',
        enum: TaskAction,
        nullable: true
    })
    action?: TaskAction;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    script_name?: string; // Script filename

    @Column({ nullable: true })
    template?: string;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.PENDING
    })
    status: TaskStatus; // Estado de la tarea (pending, running, success, failed)
}
