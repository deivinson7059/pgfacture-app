import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskSettingsDto } from './create-task-settings.dto';

export class UpdateTaskSettingsDto extends PartialType(CreateTaskSettingsDto) {}
