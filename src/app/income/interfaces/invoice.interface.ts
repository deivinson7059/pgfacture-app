export interface IInvoiceHead {
    id?: number;
    company: string;
    companyName?: string;
    branchId: number;
    branchName: string;
    type?: string;
    serial?: number;
    prefix?: string;
    consecutive: string;
    number: string;
    date?: Date;
    customerId?: number;
    customerIdentification: string;
    customerName?: string;
    totalAmount?: number;
    createdBy?: string;
    updatedBy?: string;
}

export interface IInvoiceLine {
    id?: number;
    headId: number;
    company: string;
    warehouse: string;
    serial: number;
    consecutive: string;
    number: string;
    customerId: string;
    line: number;
    code?: string;
    description?: string;
    unitCost?: number;
    listAmount?: number;
    discountId: number;
    discountPercent?: number;
    discountAmount?: number;
    taxId: number;
    taxPercent?: number;
    taxAmount?: number;
    amount?: number;
    profit?: number;
    createdBy?: string;
    updatedBy?: string;
}

export interface ICreateInvoiceResponse<H = any,L = any> {
    success: boolean;
    message: string;
    data?: {
        head: H;
        lines: L[];
    };
    error?: any;
}