import { Module } from '@nestjs/common';
import { TaskSettingsService } from './task-settings.service';
import { TaskSettingsController } from './task-settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSettings } from './entities/task-settings.entity';

@Module({
  controllers: [TaskSettingsController],
  providers: [TaskSettingsService],
   imports: [
      TypeOrmModule.forFeature([TaskSettings]),
   ],
})
export class TaskSettingsModule {}
