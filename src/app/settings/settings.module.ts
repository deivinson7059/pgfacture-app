import { Module } from '@nestjs/common';
import { CompanyController } from './controllers/company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalController } from './controllers/sucursal.controller';
import { CompanyService } from './services/company.service';
import { Company } from './entities';
import { SucursalService } from './services/sucursal.service';
import { Sucursal } from './entities/sucursal.entity';

@Module({
    controllers: [
        CompanyController,
        SucursalController
    ],
    providers: [
        CompanyService,
        SucursalService,
    ],
    imports: [
        TypeOrmModule.forFeature(
            [
                Company,
                Sucursal
            ]
        )
    ],
    exports: [
        TypeOrmModule
    ],
})
export class SettingsModule { }
