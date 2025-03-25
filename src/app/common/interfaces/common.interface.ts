export interface apiResponse<T = any> {
    message: string;
    data?: T;
    statusCode?: number;
    success?: boolean;
}

export interface PaginatedApiResponse<T> {
    message: string;
    data: {
        items: T[];
        total: number;
        page: number;
        totalPages: number;
    };
}