import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as cron from 'node-cron';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

import { TaskSettings } from './entities/task-settings.entity';
import { CreateTaskSettingsDto } from './dto/create-task-settings.dto';
import { ExecutionTime, TaskAction, TaskFrequency, TaskMethod, TaskStatus, TaskType } from './interfaces/task-settings.interface';

const SCRIPTS_DIR = path.join(__dirname, '../../server/scripts');

@Injectable()
export class TaskSettingsService implements OnModuleInit {
    constructor(
        @InjectRepository(TaskSettings)
        private readonly taskRepository: Repository<TaskSettings>,
    ) {
        if (!fs.existsSync(SCRIPTS_DIR)) {
            fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
        }
    }

    async onModuleInit() {
        console.log('🔄 Loading tasks on server startup...');
        await this.loadTasks();
    }

    async createTask(taskDto: CreateTaskSettingsDto): Promise<TaskSettings> {
        if (!taskDto.frequency || !taskDto.execution_time) {
            throw new Error('Both frequency and execution_time are required to generate schedule.');
        }

        // Generar el cron schedule
        const schedule = this.generateSchedule(taskDto.frequency, taskDto.execution_time);

        const newTask: DeepPartial<TaskSettings> = {
            ...taskDto,
            type: taskDto.type as TaskType,
            method: taskDto.method as TaskMethod,
            schedule,
            status: TaskStatus.PENDING,
        };

        const savedTask = this.taskRepository.create(newTask);
        await this.taskRepository.save(savedTask);

        // Si es una tarea IMMEDIATELY
        if (savedTask.frequency === TaskFrequency.IMMEDIATELY) {
            console.log(`🚀 Ejecutando inmediatamente la tarea: ${savedTask.name}`);

            if (savedTask.type === TaskType.CRON) {
                await this.executeCronTaskImmediately(savedTask);
            } else if (savedTask.type === TaskType.API) {
                await this.executeApiTask(savedTask);
            }

            // Eliminar la tarea después de ejecutarla
            //await this.taskRepository.delete(savedTask.id);
            // console.log(`✅ [TASK] Tarea IMMEDIATELY ejecutada y eliminada: ${savedTask.name}`);
        } else {
            // Si no es inmediatamente, programar la tarea
            if (savedTask.type === TaskType.API) {
                this.scheduleApiTask(savedTask);
            } else if (savedTask.type === TaskType.CRON) {
                await this.updateCrontab();
            }
        }

        return savedTask;
    }

    async getAllTasks(): Promise<TaskSettings[]> {
        return this.taskRepository.find();
    }

    /**
     * Genera la expresión cron con base en `frequency` y `execution_time`
     */
    private generateSchedule(frequency: TaskFrequency, executionTime: ExecutionTime): string {
        const [hour, minute] = executionTime.split(':'); // Extraer HH y MM

        switch (frequency) {
            case TaskFrequency.IMMEDIATELY:
                return `* * * * *`; // No se usa, solo para evitar errores
            case TaskFrequency.MINUTE:
                return `* * * * *`; // Cada minuto
            case TaskFrequency.HOURLY:
                return `0 * * * *`; // Cada hora en punto
            case TaskFrequency.DAILY:
                return `${minute} ${hour} * * *`; // Todos los días a la hora especificada
            case TaskFrequency.WEEKLY:
                return `${minute} ${hour} * * 0`; // Todos los domingos
            case TaskFrequency.BIWEEKLY:
                return `${minute} ${hour} 1,15 * *`; // Días 1 y 15 de cada mes
            case TaskFrequency.MONTHLY:
                return `${minute} ${hour} 1 * *`; // Día 1 de cada mes
            case TaskFrequency.YEARLY:
                return `${minute} ${hour} 1 1 *`; // Día 1 de enero
            default:
                throw new Error(`Invalid frequency: ${frequency}`);
        }
    }

    async updateCrontab() {
        const tasks = await this.getAllTasks();
        let cronEntries: string[] = [];

        tasks.forEach((task) => {
            if (task.type === TaskType.CRON && task.script_name) {
                const scriptPath = path.join(SCRIPTS_DIR, `${task.id}.sh`);

                // Crear el archivo de script con el contenido
                const scriptContent = `#!/bin/bash\n\n# Auto-generated script\n\n${task.script_name}`;
                fs.writeFileSync(scriptPath, scriptContent, { encoding: 'utf8' });

                // Dar permisos de ejecución
                exec(`chmod +x ${scriptPath}`);

                // Agregar la línea al crontab
                cronEntries.push(`${task.schedule} bash ${scriptPath}`);
            }
        });

        const newCrontab = cronEntries.join('\n');
        exec(`(crontab -l; echo "${newCrontab}") | crontab -`);
    }
 
    async loadTasks() {
        await this.updateCrontab();
    }

    async executeCronTaskImmediately(task: TaskSettings) {
        console.log(`🚀 Ejecutando inmediatamente script CRON: ${task.name}`);

        const scriptPath = path.join(SCRIPTS_DIR, `${task.id}.sh`);
        fs.writeFileSync(scriptPath, `#!/bin/bash\n\n${task.script_name}`, { encoding: 'utf8' });
        exec(`chmod +x ${scriptPath}`);

        exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ [ERROR] Error ejecutando script: ${task.name}`, stderr);
                return;
            }
            console.log(`✅ [TASK] Script ejecutado correctamente: ${stdout}`);
        });
    }

    /**
     * Programar una tarea API en `node-cron`
     */
    private scheduleApiTask(task: TaskSettings) {
        console.log(`📅 [SCHEDULING] Programando tarea API: ${task.name} - CRON: ${task.schedule}`);

        cron.schedule(task.schedule, async () => {
            await this.executeApiTask(task);
        });
    }

    /**
     * Ejecuta una tarea de tipo API
     */
    async executeApiTask(task: TaskSettings): Promise<void> {
        try {
            console.log(`⏳ [TASK] Ejecutando API: ${task.name}`);

            // Cambiar estado a RUNNING
            await this.taskRepository.update(task.id, { status: TaskStatus.RUNNING });

            const response = await axios(
                {
                    headers: { ...task.headers },
                    method: task.method,
                    url: task.endpoint,
                    data: task.data
                }
            );

            console.log(`✅ [TASK] API ejecutada correctamente: ${task.name}`);
            console.log(`🔹 [API RESPONSE]`, response.data);

            if (task.action === TaskAction.SEND_EMAIL && task.email) {
                await this.sendEmail(task.email, task.subject!, task.template || '', response.data.data);
            }

            await this.taskRepository.update(task.id, { status: TaskStatus.SUCCESS });

        } catch (error) {
            console.error(`❌ [ERROR] Falló la ejecución de la tarea API: ${task.name}`, error.message);
            await this.taskRepository.update(task.id, { status: TaskStatus.FAILED });
        }
    }

    /**
     * Envía un email usando Nodemailer
     */
    private async sendEmail(to: string, subject: string, template: string, data: any): Promise<void> {
        // Compilar la plantilla con Handlebars
        const compiledTemplate = handlebars.compile(template);
        const htmlContent = compiledTemplate({ data });

        try {
            console.log(`📧 [EMAIL] Preparando envío de correo a ${to}...`);

            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: "message@bateriaswillard.com",
                    pass: "kmdb vipq sbqa mavz",
                },
            });

            await transporter.sendMail({
                from: 'message@bateriaswillard.com',
                to,
                subject,
                html: htmlContent, // Usa la plantilla procesada
            });

            console.log(`✅ [EMAIL] Correo enviado con éxito a ${to}`);
        } catch (error) {
            console.error(`❌ [ERROR] Falló el envío del correo a ${to}:`, error.message);
        }
    }
}
