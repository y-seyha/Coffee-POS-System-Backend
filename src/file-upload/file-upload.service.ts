import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../common/entities/file_upload.entity';
import {CloudinaryService} from "./cloudinary/cloudinary.service";


@Injectable()
export class FileUploadService {
    constructor(
        private readonly cloudinaryService: CloudinaryService,

        @InjectRepository(File)
        private readonly fileRepo: Repository<File>,
    ) {}

    // =========================
    // Upload single file
    // =========================
    async uploadSingleFile(data: {
        file: Express.Multer.File;
        userId: number;
        description?: string;
    }) {
        try {
            const { file, userId, description } = data;

            if (!file) {
                throw new NotFoundException('File is required');
            }

            const result = await this.cloudinaryService.uploadFile(file);

            const newFile = this.fileRepo.create({
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: result.secure_url,
                publicId: result.public_id,
                description,
                uploader: { id: userId } as any,
            });

            return await this.fileRepo.save(newFile);
        } catch (error) {
            throw new InternalServerErrorException(
                error?.message || 'Failed to upload file',
            );
        }
    }

    // =========================
    // Upload multiple files
    // =========================
    async uploadMultipleFiles(data: {
        files: Express.Multer.File[];
        userId: number;
        description?: string;
    }) {
        try {
            const { files, userId, description } = data;

            if (!files || files.length === 0) {
                throw new NotFoundException('Files are required');
            }

            const uploaded = await Promise.all(
                files.map((file) =>
                    this.uploadSingleFile({ file, userId, description }),
                ),
            );

            return uploaded;
        } catch (error) {
            throw new InternalServerErrorException(
                error?.message || 'Failed to upload files',
            );
        }
    }

    // =========================
    // Delete file
    // =========================
    async deleteFile(id: string) {
        try {
            const file = await this.fileRepo.findOne({ where: { id } });

            if (!file) {
                throw new NotFoundException('File not found');
            }

            await this.cloudinaryService.deleteFile(file.publicId);

            await this.fileRepo.delete(id);

            return { message: 'File deleted successfully' };
        } catch (error) {
            throw new InternalServerErrorException(
                error?.message || 'Failed to delete file',
            );
        }
    }

    // =========================
    // Find all files
    // =========================
    async findAll() {
        try {
            return await this.fileRepo.find({
                relations: ['uploader'],
                order: { created_at: 'DESC' },
            });
        } catch (error) {
            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch files',
            );
        }
    }

    // =========================
    // Find one file
    // =========================
    async findOne(id: string) {
        try {
            const file = await this.fileRepo.findOne({
                where: { id },
                relations: ['uploader'],
            });

            if (!file) {
                throw new NotFoundException('File not found');
            }

            return file;
        } catch (error) {
            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch file',
            );
        }
    }
}