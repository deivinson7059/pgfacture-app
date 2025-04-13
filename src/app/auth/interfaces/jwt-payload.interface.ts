export interface JwtPayload {
    sub: number;
    ident: string;
    cmpy: string;
    ware: string;
    role_id: number;
    role: string;
    path: string;
    scopes: string[];
}