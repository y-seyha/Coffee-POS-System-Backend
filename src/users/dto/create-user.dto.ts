import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    IsNumber,
    IsDateString,
    Min,
    Matches,
} from 'class-validator';

import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

import { Type } from 'class-transformer';

export class CreateUserDto {

    @ApiProperty({
        example: 'cashier1@coffee.com',
        description: 'Unique email address for login',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'Full name of the user',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 'StrongPassword123',
        description: 'Password must be at least 6 characters',
    })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional({
        example: '+85512345678',
        description: 'Phone number (optional)',
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({
        example: 2,
        description: 'Role ID from roles table',
    })
    @Type(() => Number)
    @IsNumber({}, { message: 'role_id must be a number' })
    role_id: number;


    @ApiPropertyOptional({
        example: 'EMP-001',
        description: 'Unique employee code (required for staff roles)',
    })
    @IsOptional()
    @IsString()
    @Matches(/^EMP-\d+$/, {
        message: 'employee_code must follow format EMP-001',
    })
    employee_code?: string;

    @ApiPropertyOptional({
        example: 'Barista',
        description: 'Job position (e.g., Barista, Cashier)',
    })
    @IsOptional()
    @IsString()
    position?: string;

    @ApiPropertyOptional({
        example: '2026-01-01',
        description: 'Hire date (ISO format YYYY-MM-DD)',
    })
    @IsOptional()
    @IsDateString()
    hire_date?: string;

    @ApiPropertyOptional({
        example: 300,
        description: 'Monthly salary (must be >= 0)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'salary must be a number' })
    @Min(0)
    salary?: number;

    @ApiPropertyOptional({
        example: 'Phnom Penh',
        description: 'Employee address',
    })
    @IsOptional()
    @IsString()
    address?: string;
}