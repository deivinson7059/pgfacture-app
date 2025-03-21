import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../settings/entities/company.entity';
import { Reflector } from '@nestjs/core';
import { ParamSource } from '../enums';

@Injectable()
export class CheckCompanyGuard implements CanActivate {
    constructor(
        @InjectRepository(Company)
        private companyRepository: Repository<Company>,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Obtener la fuente de los datos desde el decorador
        const source = this.reflector.get<ParamSource>('paramSource', context.getHandler()) || ParamSource.PARAMS;

        // Obtener el ID de la compañía desde la fuente especificada
        const { cmpy } = request[source];

        if (!cmpy) {
            throw new HttpException('Se requiere el parámetro compañía', HttpStatus.BAD_REQUEST);
        }

        // Verificar que la compañía exista
        const company = await this.companyRepository.findOne({
            where: { cmpy_id: cmpy }
        });

        if (!company) {
            throw new HttpException(
                `La compañía ${cmpy} no existe en el sistema`,
                HttpStatus.BAD_REQUEST
            );
        }

        // Opcionalmente, podemos añadir la compañía al request para usarla después
        request.company = company;

        return true;
    }
}