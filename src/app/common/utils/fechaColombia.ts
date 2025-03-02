import { toZonedTime, format, formatInTimeZone } from 'date-fns-tz';
import { ValueTransformer } from 'typeorm';

// Convertir fechas a la zona horaria de Colombia
export const fechaLocal = (fechaUTC: Date) =>
    format(fechaUTC, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'America/Bogota' });

export function getFechaLocal(fechaUTC: Date = new Date()): Date {
    // Zona horaria de Colombia
    const zonaHoraria = 'America/Bogota';

    // Convertir la fecha UTC a la zona horaria de Colombia
    const fechaColombia = toZonedTime(fechaUTC, zonaHoraria);

    return fechaColombia;
}
export const dateTransformer = () => ({
    to: (value: any): Date | null => {
        if (value === null || value === undefined) return null;

        try {
            if (value instanceof Date) return value;
            return new Date(value);
        } catch (error) {
            console.error('Error transformando fecha (to):', error, value);
            return null;
        }
    },
    from: (value: any): string | null => {
        if (value === null || value === undefined) return null;

        try {
            const date = value instanceof Date ? value : new Date(value);

            // Verificar que la fecha es válida
            if (isNaN(date.getTime())) {
                console.error('Fecha inválida:', value);
                return null;
            }

            // Formatear en zona horaria de Colombia
            return formatInTimeZone(date, 'America/Bogota', 'yyyy-MM-dd HH:mm:ss');
        } catch (error) {
            console.error('Error transformando fecha (from):', error, value);
            return null;
        }
    }
});
export const dateTransformer_ = () => ({
    from: (date: Date) => {
        const zonedDate = toZonedTime(date, 'America/Bogota');
        return formatInTimeZone(
            zonedDate,
            'America/Bogota',
            'yyyy-MM-dd HH:mm:ss.SSSSSS'
        );
    },
    to: (value: string) => value
});

export const dateTransformerLoc = () => ({
    from: (date: Date) => {
        const zonedDate = toZonedTime(date, 'America/Bogota');
        return formatInTimeZone(
            zonedDate,
            'America/Bogota',
            'yyyy-MM-dd'
        );
    },
    to: (value: string) => value
});