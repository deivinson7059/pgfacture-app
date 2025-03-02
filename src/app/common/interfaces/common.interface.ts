export interface apiResponse<T = any> {
    message: string;
    data?: T;
}