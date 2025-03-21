import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from '../../settings/entities/sucursal.entity';
import { Reflector } from '@nestjs/core';
import { ParamSource } from '../enums';



@Injectable()
export class CheckSucursalGuard implements CanActivate {
    constructor(
        @InjectRepository(Sucursal)
        private sucursalRepository: Repository<Sucursal>,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Obtener la fuente de los datos desde el decorador
        const source = this.reflector.get<ParamSource>('paramSource', context.getHandler()) || ParamSource.PARAMS;

        // Obtener los parámetros desde la fuente especificada
        const { cmpy, ware } = request[source];

        if (!cmpy || !ware) {
            throw new HttpException('Se requieren los parámetros compañía y sucursal', HttpStatus.BAD_REQUEST);
        }

        // Verificar que la sucursal exista y pertenezca a la compañía
        const sucursal = await this.sucursalRepository.findOne({
            where: {
                suc_cmpy: cmpy,
                suc_nombre: ware
            }
        });

        if (!sucursal) {
            throw new HttpException(
                `La sucursal ${ware} no existe o no pertenece a la compañía ${cmpy}`,
                HttpStatus.BAD_REQUEST
            );
        }

        // Opcionalmente, podemos añadir la sucursal al request para usarla después
        request.sucursal = sucursal;

        return true;
    }
}