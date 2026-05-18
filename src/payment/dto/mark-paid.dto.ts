import {
    IsOptional,
    IsString,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkPaidDto {

    @ApiPropertyOptional({
        example: 'KHQR transaction success',
    })
    @IsOptional()
    @IsString()
    remarks?: string;

    @ApiPropertyOptional({
        example: 'ABA000123456',
    })
    @IsOptional()
    @IsString()
    transaction_id?: string;

    @ApiPropertyOptional({
        example: '{"bank":"ABA","status":"SUCCESS"}',
    })
    @IsOptional()
    @IsString()
    payment_response?: string;
}