import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
    @ApiProperty({ example: 'uuid-file-id' })
    id: string;

    @ApiProperty({ example: 'coffee.png' })
    originalName: string;

    @ApiProperty({ example: 'image/png' })
    mimeType: string;

    @ApiProperty({ example: 204800 })
    size: number;

    @ApiProperty({ example: 'https://cloudinary.com/image.jpg' })
    url: string;

    @ApiProperty({ example: 'cloudinary_public_id' })
    publicId: string;

    @ApiProperty({
        example: 'product image for iced latte',
        required: false,
    })
    description?: string;

    @ApiProperty({ example: 1 })
    uploaderId: number;

    @ApiProperty({ example: '2026-05-14T10:00:00Z' })
    created_at: Date;
}