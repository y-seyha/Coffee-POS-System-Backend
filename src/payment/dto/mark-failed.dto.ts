import {
    IsOptional,
    IsString,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkFailedDto {

    @ApiPropertyOptional({
        example: 'KHQR expired',
    })
    @IsOptional()
    @IsString()
    remarks?: string;
}