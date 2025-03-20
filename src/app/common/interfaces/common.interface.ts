export interface apiResponse<T = any> {
    message: string;
    data?: T;
    statusCode?: number;
    success?: boolean;
}