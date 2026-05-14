import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    IsNumber,
    Matches,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: 'cashier@coffee.com',
        description: 'Unique email address used for login',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'Full name of the staff/user',
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'StrongPassword123',
        description: 'Account password (min 6 characters)',
        minLength: 6,
    })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({
        example: '+85512345678',
        required: false,
        description: 'Phone number of the user (optional)',
    })
    @IsOptional()
    @Matches(/^[0-9+]{8,15}$/, {
        message: 'Phone number format is invalid',
    })
    phone?: string;

    @ApiProperty({
        example: 2,
        description: 'Role ID assigned to the user (FK to roles table)',
    })
    @IsNumber({}, { message: 'roleId must be a number' })
    roleId: number;
}