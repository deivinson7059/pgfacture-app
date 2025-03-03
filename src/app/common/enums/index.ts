// Enum para definir las posibles fuentes de datos
export enum ParamSource {
  PARAMS = 'params',
  BODY = 'body',
  QUERY = 'query',
}
/**
 * Enum que define los módulos del sistema que pueden generar asientos contables.
 * Este enum asegura la integridad referencial al registrar el origen de los asientos.
 */
export enum SEAT_MODULE {
    // Módulos del sistema
    NOTA = 'NOTE',           // Notas contables
    FACTURA = 'INVOICE',     // Facturas de venta
    COMPRA = 'SHOP',         // Compras
    GASTO = 'BILLS',         // Gastos
    NOMINA = 'PAYROLL',      // Nómina
    INVENTARIO = 'INVENTORY',// Movimientos de inventario
    AJUSTE = 'ADJUSTMENT',   // Ajustes contables
    CIERRE = 'CLOSING',      // Procesos de cierre
    DEPRECIACION = 'DEPRECIATION', // Depreciaciones
    DIFERIDO = 'DEFERRED',   // Amortización de diferidos
    RETENCION = 'RETENTION', // Retenciones
    TESORERIA = 'TREASURY',  // Tesorería (pagos, cobros)
    BANCO = 'BANK',          // Movimientos bancarios
    MANUAL = 'MANUAL',       // Asientos manuales
    SISTEMA = 'SYSTEM',      // Asientos generados por el sistema
    CAJA = 'CASH',           // Movimientos de caja
    INGRESOS = 'INCOME',     // Ingresos
    EGRESOS = 'EXPENSE'      // Egresos
}
  