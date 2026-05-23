import {
    IsBooleanString,
    IsIn,
    IsNumberString,
    IsOptional,
    IsString,
    MaxLength,

} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterUsersDto {

    @ApiPropertyOptional({
        example: 'john',
        description: 'Search users by name, email, or phone',
    })
    @IsOptional()
    @IsString({ message: 'search must be a string' })
    @MaxLength(100, { message: 'search must be less than 100 characters' })
    search?: string;

    @ApiPropertyOptional({
        example: 'ADMIN',
        description: 'Filter users by role name',
    })
    @IsOptional()
    @IsString({ message: 'role must be a string' })
    role?: string;

    @ApiPropertyOptional({
        example: 'true',
        description: 'Filter by active status (true / false as string)',
    })
    @IsOptional()
    @IsBooleanString({
        message: 'is_active must be a boolean string (true/false)',
    })
    is_active?: string;

    @ApiPropertyOptional({
        example: 'created_at',
        description: 'Field to sort users by',
        enum: [
            'id',
            'name',
            'email',
            'phone',
            'created_at',
            'updated_at',
            'is_active',
            'last_login_at',
            'role',
            'employee_code',
            'position',
            'salary',
            'hire_date',
        ],
    })
    @IsOptional()
    @IsIn([
        'id',
        'name',
        'email',
        'phone',
        'created_at',
        'updated_at',
        'is_active',
        'last_login_at',
        'role',
        'employee_code',
        'position',
        'salary',
        'hire_date',
    ], {
        message: 'Invalid sortBy field',
    })
    sortBy: string = 'created_at';

    @ApiPropertyOptional({
        example: 'DESC',
        description: 'Sort order',
        enum: ['ASC', 'DESC'],
    })
    @IsOptional()
    @IsIn(['ASC', 'DESC'], {
        message: 'order must be ASC or DESC',
    })
    order: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({
        example: 1,
        description: 'Page number (pagination starts from 1)',
        minimum: 1,
    })
    @IsOptional()
    @IsNumberString({}, { message: 'page must be a number string' })
    page: string = '1';

    @ApiPropertyOptional({
        example: 10,
        description: 'Number of items per page',
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @IsNumberString({}, { message: 'limit must be a number string' })
    limit: string = '10';
}