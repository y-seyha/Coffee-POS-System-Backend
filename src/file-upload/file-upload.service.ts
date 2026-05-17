import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    Logger,
    HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../common/entities/file_upload.entity';
import { CloudinaryService } from './cloudinary/cloudinary.service';

@Injectable()
export class FileUploadService {
    private readonly logger = new Logger(FileUploadService.name);

    constructor(
        private readonly cloudinaryService: CloudinaryService,
        @InjectRepository(File)
        private readonly fileRepo: Repository<File>,
    ) {}

    async uploadSingleFile(data: {
        file: Express.Multer.File;
        userId: number;
        productId?: number;
        description?: string;
    }) {
        const { file, userId, productId, description } = data;

        this.logger.log(
            `Uploading single file | userId=${userId} | productId=${productId ?? 'N/A'}`,
        );

        try {
            if (!file) {
                this.logger.warn('Upload failed: file is missing');
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
                product: productId ? ({ id: productId } as any) : null,
            });

            const saved = await this.fileRepo.save(newFile);

            this.logger.log(
                `File uploaded successfully | fileId=${saved.id} | url=${saved.url}`,
            );

            return saved;
        } catch (error) {
            this.logger.error(
                `Upload single file failed | userId=${userId} | productId=${productId ?? 'N/A'}`,
                error.stack,
            );

            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(
                error?.message || 'Failed to upload file',
            );
        }
    }

    async uploadMultipleFiles(data: {
        files: Express.Multer.File[];
        userId: number;
        description?: string;
    }) {
        const { files, userId, description } = data;

        this.logger.log(
            `Uploading multiple files | count=${files?.length ?? 0} | userId=${userId}`,
        );

        try {
            if (!files || files.length === 0) {
                this.logger.warn('No files provided for bulk upload');
                throw new NotFoundException('Files are required');
            }

            const uploaded = await Promise.all(
                files.map((file) =>
                    this.uploadSingleFile({
                        file,
                        userId,
                        description,
                    }),
                ),
            );

            this.logger.log(
                `Bulk upload completed | uploaded=${uploaded.length}`,
            );

            return uploaded;
        } catch (error) {
            this.logger.error(
                `Bulk upload failed | userId=${userId}`,
                error.stack,
            );

            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(
                error?.message || 'Failed to upload files',
            );
        }
    }

    async deleteFile(id: string) {
        this.logger.log(`Deleting file | fileId=${id}`);

        try {
            const file = await this.fileRepo.findOne({ where: { id } });

            if (!file) {
                this.logger.warn(`File not found | fileId=${id}`);
                throw new NotFoundException('File not found');
            }

            await this.cloudinaryService.deleteFile(file.publicId);
            await this.fileRepo.delete(id);

            this.logger.log(`File deleted successfully | fileId=${id}`);

            return { message: 'File deleted successfully' };
        } catch (error) {
            this.logger.error(`Delete file failed | fileId=${id}`, error.stack);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(
                error?.message || 'Failed to delete file',
            );
        }
    }

    async findAll() {
        this.logger.log('Fetching all files');

        try {
            return await this.fileRepo.find({
                relations: ['uploader'],
                order: { created_at: 'DESC' },
            });
        } catch (error) {
            this.logger.error('Find all files failed', error.stack);

            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch files',
            );
        }
    }

    async findOne(id: string) {
        this.logger.log(`Fetching file | fileId=${id}`);

        try {
            const file = await this.fileRepo.findOne({
                where: { id },
                relations: ['uploader'],
            });

            if (!file) {
                this.logger.warn(`File not found | fileId=${id}`);
                throw new NotFoundException('File not found');
            }

            return file;
        } catch (error) {
            this.logger.error(`Find file failed | fileId=${id}`, error.stack);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch file',
            );
        }
    }

    async uploadToCloud(file: Express.Multer.File) {
        this.logger.log(`Uploading to Cloudinary | file=${file.originalname}`);

        try {
            return await this.cloudinaryService.uploadFile(file);
        } catch (error) {
            this.logger.error(
                `Cloud upload failed | file=${file.originalname}`,
                error.stack,
            );

            throw error;
        }
    }
}