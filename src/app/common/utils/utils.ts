// Método utilitario para convertir valores a número
export const toNumber = (value: any): number => {
    // Manejar casos nulos o indefinidos
    if (value === null || value === undefined) return 0;

    // Si ya es un número, devolverlo directamente, manejando NaN
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
    }

    // Si es una cadena, intentar convertirla a número
    if (typeof value === 'string') {
        const parsed = Number(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    // Para cualquier otro tipo, devolver 0
    return 0;
};
export const formatDate = (dateStr: any): Date => {
    const [year, month, day] = dateStr.split('-').map(Number); // Convertir a números
    if (!year || !month || !day) throw new Error("Formato de fecha inválido");
    return new Date(year, month - 1, day); // Meses en JS son 0-based
};

// Función para obtener el primer o último día del mes en formato 'YYYY-MM-DD'
export const primerUltimoDia = (mes: number, anio: number, isUltimo: boolean = false): string => {
    // Validar que el mes esté en el rango correcto (1-12)
    if (mes < 1 || mes > 12) throw new Error("El mes debe estar entre 1 y 12");

    // Validar que el año sea un número válido
    if (!Number.isInteger(anio) || anio < 1) throw new Error("El año debe ser un número entero positivo");

    if (!isUltimo) {
        // Primer día del mes
        return `${anio}-${String(mes).padStart(2, '0')}-01`;
    } else {
        // Último día del mes
        const ultimoDia = new Date(anio, mes, 0).getDate(); // Día 0 del siguiente mes da el último día del actual
        return `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    }
};

export const generateRandomToken = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }

    return token;
}
// Método para formatear el nombre del rol (espacios a mayúsculas y * en lugar de espacios)
export const formatRoleName = (name: string): string => {
    return name.toUpperCase().replace(/\s+/g, '_');
}