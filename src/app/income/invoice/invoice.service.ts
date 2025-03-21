import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, QueryRunner, Repository } from "typeorm";
import { CreateInvoiceDto } from "./dto";
import { ICreateInvoiceResponse } from "./interfaces/invoice.interface";
import { InvoiceHead } from "./entities/invoice-head.entity";
import { InvoiceLine } from "./entities/invoice-line.entity";
import { Company, Sucursal } from "src/app/settings/entities";

@Injectable()
export class InvoiceService {
    constructor(
        private dataSource: DataSource,
        @InjectRepository(InvoiceHead)
        private invoiceHeadRepository: Repository<InvoiceHead>,
        @InjectRepository(InvoiceLine)
        private invoiceLineRepository: Repository<InvoiceLine>,
        @InjectRepository(Company)
        private companyRepository: Repository<Company>,

        @InjectRepository(Sucursal)
        private sucursalRepository: Repository<Sucursal>,
    ) { }

    async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<ICreateInvoiceResponse<InvoiceHead, InvoiceLine>> {
        const queryRunner = this.dataSource.createQueryRunner();

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            // Validate invoice data
            this.validateInvoiceData(createInvoiceDto);

            // Fetch company data
            const company = await this.getCompanyData(createInvoiceDto.cmpy);
            if (!company) {
                throw new HttpException(
                    `La compañia ${createInvoiceDto.cmpy} no existe`,
                    HttpStatus.NOT_FOUND
                );
            }

            // Fetch sucursal data
            const sucursal = await this.getSucursalData(createInvoiceDto.cmpy, createInvoiceDto.suc_name);
            if (!sucursal) {
                throw new HttpException(
                    `La Sucursal ${createInvoiceDto.suc_name} no existe en la compañia ${createInvoiceDto.cmpy}`,
                    HttpStatus.NOT_FOUND
                );
            }




            // Create and save invoice head
            const invoiceHead = await this.createInvoiceHead(queryRunner, createInvoiceDto, company, sucursal);

            // Create and save invoice lines
            const invoiceLines = await this.createInvoiceLines(queryRunner, invoiceHead, createInvoiceDto);

            // Update totals
            const updatedHead = await this.updateInvoiceTotals(
                queryRunner,
                invoiceHead,
                invoiceLines
            );

            await queryRunner.commitTransaction();

            return {
                success: true,
                message: 'Invoice created successfully',
                data: {
                    head: updatedHead,
                    lines: invoiceLines,
                },
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new HttpException({
                success: false,
                message: 'Failed to create invoice',
                error: error.message,
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        }
    }

    private async getCompanyData(cmpy: string): Promise<Company | null> {
        return this.companyRepository.findOne({
            where: { cmpy_id: cmpy }
        });
    }

    private async getSucursalData(cmpy: string, ware: string): Promise<Sucursal | null> {
        return this.sucursalRepository.findOne({
            where: { suc_cmpy: cmpy, suc_nombre: ware }
        });
    }

    private async createInvoiceHead(
        queryRunner: QueryRunner,
        dto: CreateInvoiceDto,
        company: Company,
        sucursal: Sucursal
    ): Promise<InvoiceHead> {
        const ih_id = await this.getNextInvoiceHeadId(queryRunner);

        const _invoiceHead: InvoiceHead = {
            ih_id,
            ih_cmpy: dto.cmpy,
            ih_cmpy_name: company.cmpy_business_name,
            ih_cmpy_address: company.cmpy_dir,
            ih_cmpy_phone: company.cmpy_tel,
            ih_cmpy_municipality: company.cmpy_municipality_id,
            ih_cmpy_email: company.cmpy_email,
            ih_sucid: sucursal.suc_id,
            ih_suc_name: dto.suc_name,
            ih_suc_address: sucursal.suc_direccion,
            ih_suc_email: sucursal.suc_email,
            ih_suc_phone: sucursal.suc_telefono,
            ih_suc_municipality: sucursal.suc_ciudad_id,
            ih_type: dto.type ?? 'FACTURA',
            ih_type_document_id: dto.type_document_id,
            ih_seri: 0,
            ih_prefix: "FE",
            ih_cons: 10,
            ih_number: "FE001",
            ih_resolution_number: dto.resolution_number,
            ih_date: dto.date ? new Date(dto.date) : new Date(),
            ih_cust_identification_number: dto.cust_identification_number,
            ih_cust_name: dto.cust_name!,
            ih_create_ucid: 'SYSTEM', // TODO: Inject current user service
            ih_create_date: new Date(),
            ih_is_el: "",
            ih_term: 0,
            ih_date_end: new Date(),
            ih_year: 0,
            ih_month: "",
            ih_time: "",
        }

        const invoiceHead = this.invoiceHeadRepository.create(_invoiceHead);

        return queryRunner.manager.save(InvoiceHead, invoiceHead);
    }

    private async createInvoiceLines(
        queryRunner: QueryRunner,
        head: InvoiceHead,
        dto: CreateInvoiceDto
    ): Promise<InvoiceLine[]> {
        const lines = await Promise.all(dto.lines.map(async (line, index) => {
            const il_id = await this.getNextInvoiceLineId(queryRunner);

            const _invoiceline: InvoiceLine = {
                il_id,
                il_ih_id: head.ih_id,
                il_cmpy: head.ih_cmpy,
                il_ware: line.ware,
                il_seri: head.ih_seri,
                il_prefix: head.ih_prefix,
                il_cons: head.ih_cons,
                il_number: head.ih_number,
                il_cust_id: head.ih_cust_identification_number,
                il_line: index + 1,
                il_prod_type: line.prod_type,
                il_code_bar: line.code,
                il_code: line.code,
                il_description: line.description,
                il_cost_uni: line.cost_uni ?? 0,
                il_list_amount: line.list_amount ?? 0,
                il_disc_id: line.disc_id,
                il_disc_percent: line.disc_percent ?? 0,
                il_disc_amount: line.disc_amount ?? 0,
                il_tax_id: line.tax_id,
                il_tax_percent: line.tax_percent ?? 0,
                il_tax_amount: line.tax_amount ?? 0,
                il_amount: line.amount ?? 0,
                il_create_ucid: 'SYSTEM',
                il_create_date: new Date(),
                il_profit: 0,
            };

            return this.invoiceLineRepository.create(_invoiceline);
        }));

        return queryRunner.manager.save(InvoiceLine, lines);
    }
    private async updateInvoiceTotals(
        queryRunner: QueryRunner,
        head: InvoiceHead,
        lines: InvoiceLine[]
    ): Promise<InvoiceHead> {
        const totals = this.calculateInvoiceTotals(lines);

        await queryRunner.manager.update(
            InvoiceHead,
            {
                ih_id: head.ih_id,
                ih_cmpy: head.ih_cmpy  // Agregamos la compañía como parte de la clave
            },
            totals
        );

        // Devolvemos el objeto combinado con los nuevos totales
        return Object.assign(head, totals);
    }

    private calculateInvoiceTotals(lines: InvoiceLine[]) {
        const totals = {
            ih_lines: lines.length,
            ih_line_extension_amount: 0,
            ih_tax_exclusive_amount: 0,
            ih_tax_inclusive_amount: 0,
            ih_tax_amount: 0,
            ih_dis_amount: 0,
            ih_total_amount: 0,
            ih_payable_amount: 0,
        };

        for (const line of lines) {
            totals.ih_line_extension_amount += line.il_list_amount ?? 0;
            totals.ih_dis_amount += line.il_disc_amount ?? 0;
            totals.ih_tax_amount += line.il_tax_amount ?? 0;
        }

        totals.ih_tax_exclusive_amount = totals.ih_line_extension_amount - totals.ih_dis_amount;
        totals.ih_tax_inclusive_amount = totals.ih_tax_exclusive_amount + totals.ih_tax_amount;
        totals.ih_total_amount = totals.ih_tax_inclusive_amount;
        totals.ih_payable_amount = totals.ih_total_amount;

        return totals;
    }

    private async getNextInvoiceHeadId(queryRunner: QueryRunner): Promise<number> {
        const result = await queryRunner.manager
            .createQueryBuilder(InvoiceHead, 'InvoiceHead')
            .select('COALESCE(MAX(InvoiceHead.ih_id), 0)', 'max')
            .getRawOne();

        return Number(result.max) + 1;
    }

    private async getNextInvoiceLineId(queryRunner: QueryRunner): Promise<number> {
        const result = await queryRunner.manager
            .createQueryBuilder(InvoiceLine, 'InvoiceLine')
            .select('COALESCE(MAX(InvoiceLine.il_id), 0)', 'max')
            .getRawOne();

        return Number(result.max) + 1;
    }

    private validateInvoiceData(dto: CreateInvoiceDto) {
        if (!dto.lines?.length) {
            throw new HttpException(
                'Invoice must have at least one line',
                HttpStatus.BAD_REQUEST
            );
        }

        /* if (!dto.lines.every(line => line.number === dto.number)) {
            throw new HttpException(
                'All lines must belong to the same invoice',
                HttpStatus.BAD_REQUEST
            );
        } */

        // Space for additional validations as needed
    }
}

