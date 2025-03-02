import { Expose } from "class-transformer";
  
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

    // Campos opcionales con valores por defecto
    @Expose({ name: 'different_reason' })
    different_reason?: string = 'NO';

    @Expose({ name: 'zero_invoice' })
    zero_invoice?: string = 'NO';

    @Expose({ name: 'sw_code' })
    sw_code?: string = 'OFF';

    @Expose({ name: 'sw' })
    sw?: string = 'OFF';

    @Expose({ name: 'include_vat' })
    include_vat?: string = 'NO';

    @Expose({ name: 'show_users' })
    show_users?: string = 'SI';

    @Expose({ name: 'electronic_invoice' })
    electronic_invoice?: string = 'NO';

    @Expose({ name: 'active' })
    active?: string = 'SI';

    @Expose({ name: 'reteica' })
    reteica?: number = 0.00;

    @Expose({ name: 'terms' })
    terms?: string;

    @Expose({ name: 'list' })
    list?: string = 'P1';
}