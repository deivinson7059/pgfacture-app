export interface PUC {
    code: string;
    cmpy: string;
    description: string;
    nature: string;
    classification: string;
    parent_account: string | null;
    active: string;
    creation_by?: string;
    creation_date?: Date;
    updated_by?: string | null;
    updated_date?: Date | null;
    children?: PUC[];
}

export interface PucResponseOnly {
    message: string;
    data: PUC | null;
}

export interface PucResponse {
    message: string;
    data: PUC[];
}
