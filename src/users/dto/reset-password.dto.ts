import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        example: 'NewStrongPassword123',
        description: 'New password for the user',
    })
    @IsString()
    @MinLength(6)
    new_password: string;
}