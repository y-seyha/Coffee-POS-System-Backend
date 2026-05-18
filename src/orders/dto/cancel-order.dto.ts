import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
    @ApiPropertyOptional({
        example: 'Customer changed mind',
        description: 'Reason for cancelling the order',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({
        message: 'reason must be a string',
    })
    @MaxLength(255, {
        message: 'reason cannot exceed 255 characters',
    })
    reason?: string;
}