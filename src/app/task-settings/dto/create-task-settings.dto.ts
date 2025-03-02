import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ExecutionTime, TaskAction, TaskFrequency, TaskType } from '../interfaces/task-settings.interface';

export class CreateTaskSettingsDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsEnum(TaskType, { message: 'Invalid type. Allowed values: cron, api' })
    type: string; // 'cron' or 'api'

    @IsOptional()
    @IsString()
    endpoint?: string;

    @IsOptional()
    @IsObject()
    headers?: object;

    /**
     * ✅ `data` es obligatorio solo si:
     * 1. `type === 'api'`
     * 2. `method` es `POST`, `PUT` o `PATCH`
     */
    @ValidateIf(task => task.type === TaskType.API && ['POST', 'PUT', 'PATCH'].includes(task.method!))
    @IsNotEmpty({ message: 'Data is required for POST, PUT, and PATCH requests.' })
    @IsObject()
    data?: object;

    @IsOptional()
    @IsString()
    method?: string; // GET, POST, etc.

    @IsOptional()
    @ValidateIf((task) => task.type === TaskType.API)
    subject?: string;

    @IsOptional()
    schedule?: string; // Se generará automáticamente en el backend

    @IsEnum(TaskFrequency, { message: 'Invalid frequency. Allowed values: minute,hourly,daily, weekly, biweekly, monthly, yearly' })
    frequency: TaskFrequency;

    @IsEnum(ExecutionTime, { message: 'Invalid execution_time. Allowed values: 00:00, 01:00, ..., 23:00' })
    execution_time: ExecutionTime;

    @IsOptional()
    @ValidateIf((task) => task.type === TaskType.API)
    @IsEnum(TaskAction, { message: 'Invalid action. Allowed values: send_email, none, null' })
    action?: TaskAction;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    template?: string;

    @IsOptional()
    @IsString()
    script_name?: string; // Para tareas CRON 
}
