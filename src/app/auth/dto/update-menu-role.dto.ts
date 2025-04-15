import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuRoleDto } from './create-menu-role.dto';

export class UpdateMenuRoleDto extends PartialType(CreateMenuRoleDto) { }