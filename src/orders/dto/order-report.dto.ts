import {
    IsOptional,
    IsDateString,
    IsInt,
    Min,
    Max,
} from 'class-validator';

import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrderReportDto {
    @ApiPropertyOptional({
        example: '2026-05-01',
        description: 'Report start date',
    })
    @IsOptional()
    @IsDateString({}, {
        message: 'from must be a valid ISO date',
    })
    from?: string;

    @ApiPropertyOptional({
        example: '2026-05-31',
        description: 'Report end date',
    })
    @IsOptional()
    @IsDateString({}, {
        message: 'to must be a valid ISO date',
    })
    to?: string;

    @ApiPropertyOptional({
        example: 10,
        description: 'Top products limit',
        default: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({
        message: 'limit must be an integer',
    })
    @Min(1, {
        message: 'limit must be at least 1',
    })
    @Max(100, {
        message: 'limit cannot exceed 100',
    })
    limit?: number = 10;
}