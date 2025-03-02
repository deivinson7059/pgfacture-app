import { Controller, Get, Post, Body, ValidationPipe, UsePipes } from '@nestjs/common';
import { TaskSettings } from './entities/task-settings.entity';
import { CreateTaskSettingsDto } from './dto/create-task-settings.dto';
import { TaskSettingsService } from './task-settings.service';

@Controller('task')
export class TaskSettingsController {
    constructor(private readonly taskSettingsService: TaskSettingsService) { }

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async createTask(@Body() createTaskDto: CreateTaskSettingsDto) {
        return this.taskSettingsService.createTask(createTaskDto);
    }

    @Get(':id')
    getAllTasks(): Promise<TaskSettings[]> {
        return this.taskSettingsService.getAllTasks();
    }
}
