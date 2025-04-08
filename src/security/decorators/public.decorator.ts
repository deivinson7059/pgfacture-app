import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como pública, permitiendo el acceso sin autenticación
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);