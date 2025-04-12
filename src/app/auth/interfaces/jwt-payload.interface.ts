export interface JwtPayload {
    sub: number;
    ident: string;
    company: string;
    branch: string;
    role_id: string;
    role_name: string;
    scopes: string[];
}