import { NoteHeader, NoteLine } from "../entities";

export type NoteHeaderWithLines = NoteHeader & { lines: NoteLine[] };

export interface NoteWithLines {
    id: number;
    cmpy: string;
    ware: string;
    year: number;
    per: number;
    date: Date;
    time: string;
    customer: string;
    customer_name: string;
    description: string;
    status: string;
    total_debit: number;
    total_credit: number;
    reference: string;
    ccosto?: string;
    creation_by: string;
    creation_date: Date;
    updated_by?: string;
    updated_date?: Date;
    approved_by?: string;
    approved_date?: Date;
    observations?: string;
    external_reference?: string;
    doc_type?: string;
    area?: string;
    priority: string;
    auto_accounting: boolean;
    accounting_date?: Date;
    lines: any[];
}