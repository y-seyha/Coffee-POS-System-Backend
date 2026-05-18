import {
    IsOptional,
    IsString,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {

    @ApiPropertyOptional({
        example: 'Customer cancelled order',
    })
    @IsOptional()
    @IsString()
    reason?: string;
}