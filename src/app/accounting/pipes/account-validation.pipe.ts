// src/asiento/pipes/account-validation.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { Puc } from '../entities';

@Injectable()
export class AccountValidationPipe implements PipeTransform {
  constructor(
    @InjectRepository(Puc)
    private accountPlanRepository: Repository<Puc>,
  ) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || !value.movimientos) {
      return value;
    }

    for (const movimiento of value.movimientos) {
      const accountPlan = await this.accountPlanRepository.findOne({
        where: {
          plcu_cmpy: In(['ALL', value.acch_cmpy]),
          plcu_id: movimiento.account,
        },
      });
      if (!accountPlan) {
        throw new NotFoundException(`Cuenta ${movimiento.account} no encontrada en el plan de cuentas`);
      }
      // Asignar account_name al movimiento para usarlo después
      movimiento.account_name = accountPlan.plcu_description;
    }

    return value;
  }
}