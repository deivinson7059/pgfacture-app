import { NoteHeader, NoteLine, Seat } from "@accounting/entities";

import { Comment } from '@shared/entities'

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
    status: string;
    total_debit: number;
    total_credit: number;
    reference: string;
    cost_center?: string;
    creation_by: string;
    creation_date: Date;
    updated_by?: string;
    updated_date?: Date;
    approved_by?: string;
    approved_date?: Date;
    accounting_date?: Date;
    code?: string;
    lines: any[];
    comments: Comment[];
    seats: Seat[];
}