import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedResponse } from './interfaces/seed.interface';

@Controller('seed')
export class SeedController {
    constructor(private readonly seedService: SeedService) { }
 
    @Get()
    async executeSeed(): Promise<SeedResponse> {
        await this.seedService.runSeed()
        return {
            message: 'SEED EXECUTED'
        }
    }
}
