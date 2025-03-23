import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Balance, BalanceDetail, Period } from '@accounting/entities';

import { toNumber } from '@common/utils/utils';

@Injectable()
export class NiifReportsService {
    constructor(
        @InjectRepository(Balance)
        private balanceRepository: Repository<Balance>,
        @InjectRepository(BalanceDetail)
        private balanceDetailRepository: Repository<BalanceDetail>,
        @InjectRepository(Period)
        private periodRepository: Repository<Period>,
    ) { }
    async generateEstadoResultadosNiif(cmpy: string, ware: string, year: number, per: number): Promise<any> {
        try {

            // Obtener el período para obtener las fechas de inicio y fin
            const period = await this.periodRepository.findOne({
                where: {
                    accp_cmpy: cmpy,
                    accp_year: year,
                    accp_per: per
                }
            });

            if (!period) {
                throw new NotFoundException(`Período ${per} del año ${year} no encontrado`);
            }

            // Usamos las fechas del período
            const startDate = period.accp_start_date;
            const endDate = period.accp_end_date;


            // Buscar detalles del balance para cuentas de resultados (4, 5, 6, 7)
            const resultadosDetails = await this.balanceDetailRepository.find({
                where: {
                    acbd_cmpy: cmpy,
                    acbd_per: per,
                    acbd_year: year,
                },
                order: {
                    acbd_account: 'ASC'
                }
            });

            //console.log(resultadosDetails);

            if (resultadosDetails.length === 0) {
                throw new HttpException(
                    'No se encontraron datos para el período especificado',
                    HttpStatus.NOT_FOUND
                );
            }

            // Categorizar las cuentas según estructura NIIF
            const ingresos = this.filtrarCuentasPorClase(resultadosDetails, '4');
            const costos = [
                ...this.filtrarCuentasPorClase(resultadosDetails, '6'),
                ...this.filtrarCuentasPorClase(resultadosDetails, '7')
            ];
            const gastosAdministracion = this.filtrarCuentasPorClase(resultadosDetails, '51');
            const gastosVentas = this.filtrarCuentasPorClase(resultadosDetails, '52');
            const otrosIngresos = this.filtrarCuentasPorClase(resultadosDetails, '42');
            const otrosGastos = this.filtrarCuentasPorClase(resultadosDetails, '53');
            const gastosFinancieros = this.filtrarCuentasPorPrefijo(resultadosDetails, '5305');
            const impuestos = this.filtrarCuentasPorClase(resultadosDetails, '54');

            // Calcular totales
            const totalIngresos = this.calcularTotal(ingresos);
            const totalCostos = this.calcularTotal(costos);
            const totalGastosAdmin = this.calcularTotal(gastosAdministracion);
            const totalGastosVentas = this.calcularTotal(gastosVentas);
            const totalOtrosIngresos = this.calcularTotal(otrosIngresos);
            const totalOtrosGastos = this.calcularTotal(otrosGastos);
            const totalFinancieros = this.calcularTotal(gastosFinancieros);
            const totalImpuestos = this.calcularTotal(impuestos);

            // Calcular resultados intermedios
            const gananciaBruta = totalIngresos - totalCostos;
            const gastosOperacion = totalGastosAdmin + totalGastosVentas;
            const gananciaPorActividades = gananciaBruta - gastosOperacion;
            const otrosIngresosGastos = totalOtrosIngresos - totalOtrosGastos - totalFinancieros;
            const gananciaAntesImpuestos = gananciaPorActividades + otrosIngresosGastos;
            const gananciaNetaEjercicio = gananciaAntesImpuestos - totalImpuestos;

            // Construir la estructura del informe
            return {
                empresa: {
                    nombre: 'DEMO OFICINAPRO.CO',
                    nit: cmpy,
                    fecha_inicial: startDate,
                    fecha_corte: endDate,
                },
                operaciones_continuadas: {
                    ingresos_actividades_ordinarias: {
                        total: this.formatearNumero(totalIngresos),
                        detalle: this.formatearDetalle(ingresos)
                    },
                    costo_ventas: {
                        total: this.formatearNumero(totalCostos),
                        detalle: this.formatearDetalle(costos)
                    },
                    ganancia_bruta: this.formatearNumero(gananciaBruta),
                    gastos_operacion: {
                        gastos_administracion: {
                            total: this.formatearNumero(totalGastosAdmin),
                            detalle: this.formatearDetalle(gastosAdministracion)
                        },
                        gastos_ventas: {
                            total: this.formatearNumero(totalGastosVentas),
                            detalle: this.formatearDetalle(gastosVentas)
                        },
                        total_gastos_operacion: this.formatearNumero(gastosOperacion)
                    },
                    ganancia_actividades_operacion: this.formatearNumero(gananciaPorActividades),
                    otros_resultados: {
                        otros_ingresos: {
                            total: this.formatearNumero(totalOtrosIngresos),
                            detalle: this.formatearDetalle(otrosIngresos)
                        },
                        otros_gastos: {
                            total: this.formatearNumero(totalOtrosGastos),
                            detalle: this.formatearDetalle(otrosGastos)
                        },
                        gastos_financieros: {
                            total: this.formatearNumero(totalFinancieros),
                            detalle: this.formatearDetalle(gastosFinancieros)
                        },
                        total_otros_resultados: this.formatearNumero(otrosIngresosGastos)
                    },
                    ganancia_antes_impuestos: this.formatearNumero(gananciaAntesImpuestos),
                    impuestos_ganancias: {
                        total: this.formatearNumero(totalImpuestos),
                        detalle: this.formatearDetalle(impuestos)
                    },
                    ganancia_neta_ejercicio: this.formatearNumero(gananciaNetaEjercicio)
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                `Error al generar el estado de resultados NIIF: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private filtrarCuentasPorClase(cuentas: BalanceDetail[], clase: string): BalanceDetail[] {
        return cuentas.filter(cuenta => cuenta.acbd_account.startsWith(clase));
    }

    private filtrarCuentasPorPrefijo(cuentas: BalanceDetail[], prefijo: string): BalanceDetail[] {
        return cuentas.filter(cuenta => cuenta.acbd_account.startsWith(prefijo));
    }

    private calcularTotal(cuentas: BalanceDetail[]): number {
        return cuentas.reduce((total, cuenta) => {
            // Determinar la naturaleza de la cuenta basado en su clase
            const primeraDigito = cuenta.acbd_account.charAt(0);
            let saldo = 0;

            if (['1', '5', '6', '7', '8'].includes(primeraDigito)) {
                // Debito - Crédito para cuentas de naturaleza débito
                saldo = toNumber(cuenta.acbd_balance);
            } else {
                // Crédito - Débito para cuentas de naturaleza crédito
                saldo = -toNumber(cuenta.acbd_balance);
            }

            return total + saldo;
        }, 0);
    }

    private formatearDetalle(cuentas: BalanceDetail[]): any[] {
        return cuentas.map(cuenta => {
            const primeraDigito = cuenta.acbd_account.charAt(0);
            let valor = 0;

            if (['1', '5', '6', '7', '8'].includes(primeraDigito)) {
                valor = toNumber(cuenta.acbd_balance);
            } else {
                valor = -toNumber(cuenta.acbd_balance);
            }

            return {
                cuenta: cuenta.acbd_account,
                descripcion: cuenta.acbd_account_name,
                valor: this.formatearNumero(valor)
            };
        });
    }

    private formatearNumero(numero: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Math.abs(numero));
    }
}