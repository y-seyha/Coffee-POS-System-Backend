import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Matches,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantGroupDto {
    @ApiProperty({
        example: 'SIZE',
        description: 'Display name of the variant group.',
    })
    @IsString({
        message: 'Name must be a string',
    })
    @IsNotEmpty({
        message: 'Name is required',
    })
    @MaxLength(100, {
        message: 'Name cannot exceed 100 characters',
    })
    name: string;

    @ApiProperty({
        example: 'size',
        description:
            'Unique internal code used by the system. Use lowercase letters and underscores only.',
    })
    @IsString({
        message: 'Code must be a string',
    })
    @IsNotEmpty({
        message: 'Code is required',
    })
    @MaxLength(100, {
        message: 'Code cannot exceed 100 characters',
    })
    @Matches(/^[a-z0-9_]+$/, {
        message:
            'Code can only contain lowercase letters, numbers, and underscores',
    })
    code: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Enable or disable this variant group.',
        default: true,
    })
    @IsOptional()
    @IsBoolean({
        message: 'is_active must be a boolean value',
    })
    is_active?: boolean;
}