import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'admin@coffee.com',
        description: 'Registered email address of the user',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        example: 'StrongPassword123',
        description: 'User password (minimum 6 characters)',
        minLength: 6,
    })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
}