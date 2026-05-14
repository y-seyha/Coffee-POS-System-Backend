import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadFileDto {
    @ApiPropertyOptional({
        description: 'Optional description for the uploaded file',
        example: 'Product image for iced latte',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    description?: string;
}