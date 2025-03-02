import { Module } from '@nestjs/common';
import { CompanyController } from './company/company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalController } from './sucursal/sucursal.controller';
import { CompanyService } from './company/company.service';
import { Company } from './company/entities';
import { SucursalService } from './sucursal/sucursal.service';
import { Sucursal } from './sucursal/entities/sucursal.entity';

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
