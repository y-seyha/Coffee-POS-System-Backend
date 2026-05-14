import {
    Controller,
    Post,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
    Body,
    Delete,
    Param,
    Get,
    Req,
    BadRequestException,
} from '@nestjs/common';
import {
    FileInterceptor,
    FilesInterceptor,
} from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';

import type { Request } from 'express';
import {UploadFileDto} from "./dto/upload_single_file.dto";
import {UploadMultipleFilesDto} from "./dto/upload_multiple_files.dto";

@Controller('files')
export class FileUploadController {
    constructor(private readonly fileService: FileUploadService) {}

    // =========================
    // Upload single file
    // =========================
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadSingle(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileDto,
        @Req() req: Request,
    ) {
        try {
            if (!file) {
                throw new BadRequestException('File is required');
            }

            const userId = (req as any).user?.id;

            return await this.fileService.uploadSingleFile({
                file,
                userId,
                description: dto.description,
            });
        } catch (error) {
            throw new BadRequestException(
                error?.message || 'Upload failed',
            );
        }
    }

    // =========================
    // Upload multiple files
    // =========================
    @Post('upload-multiple')
    @UseInterceptors(FilesInterceptor('files'))
    async uploadMultiple(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: UploadMultipleFilesDto,
        @Req() req: Request,
    ) {
        try {
            if (!files || files.length === 0) {
                throw new BadRequestException('Files are required');
            }

            const userId = (req as any).user?.id;

            return await this.fileService.uploadMultipleFiles({
                files,
                userId,
                description: dto.description,
            });
        } catch (error) {
            throw new BadRequestException(
                error?.message || 'Upload failed',
            );
        }
    }

    // =========================
    // Delete file
    // =========================
    @Delete(':id')
    async delete(@Param('id') id: string) {
        try {
            return await this.fileService.deleteFile(id);
        } catch (error) {
            throw new BadRequestException(
                error?.message || 'Delete failed',
            );
        }
    }

    // =========================
    // Get all files
    // =========================
    @Get()
    async findAll() {
        try {
            return await this.fileService.findAll();
        } catch (error) {
            throw new BadRequestException(
                error?.message || 'Fetch failed',
            );
        }
    }

    // =========================
    // Get single file
    // =========================
    @Get(':id')
    async findOne(@Param('id') id: string) {
        try {
            return await this.fileService.findOne(id);
        } catch (error) {
            throw new BadRequestException(
                error?.message || 'Fetch failed',
            );
        }
    }
}