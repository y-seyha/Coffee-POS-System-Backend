import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
    @ApiProperty({
        example: 'cashier@coffee.com',
        description: 'Email address to resend verification link',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
}