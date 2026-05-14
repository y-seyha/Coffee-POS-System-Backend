import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadMultipleFilesDto {
    @ApiPropertyOptional({
        description: 'Optional description applied to all uploaded files',
        example: 'Menu images batch upload',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    description?: string;
}