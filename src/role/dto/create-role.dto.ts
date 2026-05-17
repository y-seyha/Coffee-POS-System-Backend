import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Matches,
} from 'class-validator';

export class CreateRoleDto {
    @ApiProperty({
        example: 'ADMIN',
        description:
            'Role name used for access control (must be UPPERCASE, e.g. ADMIN, CASHIER, MANAGER)',
        minLength: 2,
        maxLength: 50,
        pattern: '^[A-Z_]+$',
    })
    @IsString({ message: 'Role name must be a string' })
    @IsNotEmpty({ message: 'Role name is required' })
    @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
    @Matches(/^[A-Z_]+$/, {
        message:
            'Role name must contain only uppercase letters and underscore (A-Z, _)',
    })
    name: string;

    @ApiProperty({
        example: 'Full system access with all permissions',
        required: false,
        description:
            'Optional description explaining what this role can access',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @MaxLength(255, {
        message: 'Description must not exceed 255 characters',
    })
    description?: string;
}