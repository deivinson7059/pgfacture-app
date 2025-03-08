/**
 * Formatea un valor decimal para mostrar exactamente el número de decimales especificado
 * @param precision Número de decimales a mostrar
 */
export const formatDecimal = (precision: number = 2) => {
    return ({ value }: { value: any }): any => {
        if (value === null || value === undefined) return value;
        
        if (typeof value === 'number' || !isNaN(parseFloat(value))) {
            // Convertir a número si es string y formatear con exactamente 'precision' decimales
            const num = typeof value === 'string' ? parseFloat(value) : value;
            return num.toFixed(precision);
        }
        
        return value;
    };
};