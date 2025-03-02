

export interface PucSeed {
    account: string;
    name: string;
}

export interface SeedData {
    accounts: PucSeed[];
}

export interface SeedResponse {
    message: string;
}