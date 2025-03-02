import { Controller, Post, Body, HttpException, HttpStatus, ClassSerializerInterceptor, UseInterceptors } from "@nestjs/common";
import { CreateInvoiceDto } from "./dto";
import { ICreateInvoiceResponse } from "./interfaces/invoice.interface";
import { InvoiceService } from "./invoice.service";

@Controller('income/invoice')
@UseInterceptors(ClassSerializerInterceptor)
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) { }

    @Post()
    async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto): Promise<ICreateInvoiceResponse> {
        try {
            const result = await this.invoiceService.createInvoice(createInvoiceDto);
            return result;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException({
                success: false,
                message: 'Error inesperado al crear la factura',
                error: error.message,
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}