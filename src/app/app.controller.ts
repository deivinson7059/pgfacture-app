import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { apiResponse } from './common/interfaces/common.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): apiResponse {
    return this.appService.getHello();
  }
}
