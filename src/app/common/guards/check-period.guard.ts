import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Period } from '../../accounting/entities/period.entity';
import { Reflector } from '@nestjs/core';
import { ParamSource } from '../enums';

@Injectable()
export class CheckPeriodGuard implements CanActivate {
  constructor(
    @InjectRepository(Period)
    private periodRepository: Repository<Period>,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Obtener la fuente de los datos desde el decorador
    const source = this.reflector.get<ParamSource>('paramSource', context.getHandler()) || ParamSource.PARAMS;
    
    // Obtener los datos desde la fuente especificada
    const { cmpy, year, per } = request[source];

    // Convertir a número
    const yearNum = parseInt(year, 10);
    const perNum = parseInt(per, 10);

    if (!cmpy || !yearNum || !perNum) {
      throw new HttpException('Se requieren los parámetros compañía, año y periodo', HttpStatus.BAD_REQUEST);
    }

    // Verificar que el periodo exista y esté abierto
    const period = await this.periodRepository.findOne({
      where: {
        accp_cmpy: cmpy,
        accp_year: yearNum,
        accp_per: perNum,
        accp_status: 'O' // 'O' = Open (Abierto)
      }
    });

    if (!period) {
      throw new HttpException(
        `El periodo ${perNum} del año ${yearNum} no existe o no está abierto para la compañía ${cmpy}`,
        HttpStatus.BAD_REQUEST
      );
    }
    
    return true;
  }
}