import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({
        example: 'Drinks',
        description: 'Category name',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: 'Cold and hot beverages',
    })
    @IsOptional()
    @IsString()
    description?: string;
}