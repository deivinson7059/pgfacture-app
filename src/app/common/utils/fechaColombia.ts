import { toZonedTime, format, formatInTimeZone } from 'date-fns-tz';

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
    from: (date_: Date | string | number | null | undefined) => {
        // Si no hay valor, usa la fecha actual en zona horaria de Bogotá
        const date = date_ ? new Date(date_) : new Date();
        if (isNaN(date.getTime())) return formatInTimeZone(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm:ss.SSSSSS'); // Maneja fechas inválidas

        const zonedDate = toZonedTime(date, 'America/Bogota');
        return formatInTimeZone(zonedDate, 'America/Bogota', 'yyyy-MM-dd HH:mm:ss.SSSSSS');
    },
    to: (value: string | null | undefined) => value || formatInTimeZone(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm:ss.SSSSSS') // Si es null, guarda la fecha actual
});
export const dateTransformer_ = () => ({   
    from: (date_: Date) => {
        const date = date_ instanceof Date ? date_ : new Date(date_);       
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
 
export const dateTransformerLoc_ = () => ({
    from: (value: Date | null) => {
        // De la BD a la app: convierte la fecha a string 'yyyy-MM-dd'
        if (!value) return null;
        const zonedDate = toZonedTime(value, 'America/Bogota');
        return formatInTimeZone(zonedDate, 'America/Bogota', 'yyyy-MM-dd');
    },
    to: (value: string | Date | null) => {
        // De la app a la BD: convierte el valor a un objeto Date para el tipo 'date'
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        const zonedDate = toZonedTime(date, 'America/Bogota');
        // Devuelve solo la fecha como Date sin hora
        return new Date(formatInTimeZone(zonedDate, 'America/Bogota', 'yyyy-MM-dd'));
    }
});
