import { Expose } from "class-transformer";
import { IsOptional } from "class-validator";

export class CreateSucursalDto {
    @Expose({ name: 'cmpy' })
    cmpy: string;

    @Expose({ name: 'name' })
    name: string;

    @Expose({ name: 'address' })
    address: string;

    @Expose({ name: 'email' })
    email: string;

    @Expose({ name: 'department' })
    department: string;

    @Expose({ name: 'city' })
    city: string;

    @Expose({ name: 'city_id' })
    city_id?: number;

    @Expose({ name: 'phone' })
    phone: string;

    @Expose({ name: 'mobile' })
    mobile: string;

    @Expose({ name: 'reason' })
    reason: string;

    @Expose({ name: 'tax_id' })
    tax_id: string;

    @Expose({ name: 'logo' })
    logo: string;

    @IsOptional()
    @Expose({ name: 'different_reason' })
    different_reason?: string = 'NO';

    @IsOptional()
    @Expose({ name: 'zero_invoice' })
    zero_invoice?: string = 'NO';

    @IsOptional()
    @Expose({ name: 'sw_code' })
    sw_code?: string = 'OFF';

    @IsOptional()
    @Expose({ name: 'sw' })
    sw?: string = 'OFF';

    @IsOptional()
    @Expose({ name: 'include_vat' })
    include_vat?: string = 'NO';

    @IsOptional()
    @Expose({ name: 'show_users' })
    show_users?: string = 'SI';

    @IsOptional()
    @Expose({ name: 'electronic_invoice' })
    electronic_invoice?: string = 'NO';

    @IsOptional()
    @Expose({ name: 'active' })
    active?: string = 'SI';

    @IsOptional()
    @Expose({ name: 'reteica' })
    reteica?: number = 0.00;

    @IsOptional()
    @Expose({ name: 'terms' })
    terms?: string;

    @IsOptional()
    @Expose({ name: 'list' })
    list?: string = 'P1';
}