export interface JwtPayload {
    sub: number;
    ident: string;
    company: string;
    branch: string;
    role_id: number;
    role_name: string;
    role_path: string;
    scopes: string[];
}