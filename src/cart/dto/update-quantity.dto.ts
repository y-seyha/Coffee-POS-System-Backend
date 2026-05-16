import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateQuantityDto {
    @ApiProperty({
        example: 3,
        description: 'New quantity for the cart item',
        minimum: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}