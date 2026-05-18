import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrderIdDto {
    @ApiProperty({
        example: 1,
        description: 'Order ID',
    })
    @Type(() => Number)
    @IsInt({
        message: 'id must be an integer',
    })
    @Min(1, {
        message: 'id must be greater than 0',
    })
    id: number;
}