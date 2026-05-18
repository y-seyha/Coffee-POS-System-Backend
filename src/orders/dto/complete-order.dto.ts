import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteOrderDto {
    @ApiPropertyOptional({
        example: 'Order delivered successfully',
        description: 'Completion note',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({
        message: 'note must be a string',
    })
    @MaxLength(255, {
        message: 'note cannot exceed 255 characters',
    })
    note?: string;
}