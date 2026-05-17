import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadService } from './file-upload.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { File } from '../common/entities/file_upload.entity';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let repo: any;
  let cloudinary: any;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockCloudinary = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: getRepositoryToken(File),
          useValue: mockRepo,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinary,
        },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    repo = module.get(getRepositoryToken(File));
    cloudinary = module.get(CloudinaryService);

    jest.clearAllMocks();
  });

  const mockFileEntity = () => ({
    id: '1',
    originalName: 'test.png',
    mimeType: 'image/png',
    size: 100,
    url: 'http://cloud.com/file.png',
    publicId: 'abc123',
    uploader: { id: 1 },
    product: null,
  });

  // uploadSingleFile
  describe('uploadSingleFile', () => {
    it('should upload file successfully', async () => {
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 100,
      } as Express.Multer.File;

      cloudinary.uploadFile.mockResolvedValue({
        secure_url: 'http://cloud.com/file.png',
        public_id: 'abc123',
      });

      repo.create.mockReturnValue(mockFileEntity());
      repo.save.mockResolvedValue(mockFileEntity());

      const result = await service.uploadSingleFile({
        file,
        userId: 1,
        productId: 2,
        description: 'test',
      });

      expect(result.id).toBe('1');
      expect(cloudinary.uploadFile).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when file is missing', async () => {
      await expect(
          service.uploadSingleFile({
            file: null as any,
            userId: 1,
          }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should wrap cloudinary error', async () => {
      const file = {
        originalname: 'test.png',
      } as Express.Multer.File;

      cloudinary.uploadFile.mockRejectedValue(new Error('Cloud error'));

      repo.create.mockReturnValue(mockFileEntity());
      repo.save.mockResolvedValue(mockFileEntity());

      await expect(
          service.uploadSingleFile({
            file,
            userId: 1,
          }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // uploadMultipleFiles
  describe('uploadMultipleFiles', () => {
    it('should upload multiple files', async () => {
      const file = {
        originalname: 'a.png',
        mimetype: 'image/png',
        size: 100,
      } as Express.Multer.File;

      jest.spyOn(service, 'uploadSingleFile').mockResolvedValue({
        id: '1',
      } as any);

      const result = await service.uploadMultipleFiles({
        files: [file, file],
        userId: 1,
      });

      expect(result.length).toBe(2);
    });

    it('should throw when files empty', async () => {
      await expect(
          service.uploadMultipleFiles({
            files: [],
            userId: 1,
          }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle failure inside uploadSingleFile', async () => {
      jest.spyOn(service, 'uploadSingleFile').mockRejectedValue(
          new Error('fail'),
      );

      const file = {} as Express.Multer.File;

      await expect(
          service.uploadMultipleFiles({
            files: [file, file],
            userId: 1,
          }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // deleteFile
  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      repo.findOne.mockResolvedValue({
        id: '1',
        publicId: 'cloud123',
      });

      cloudinary.deleteFile.mockResolvedValue({});

      repo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteFile('1');

      expect(result.message).toBe('File deleted successfully');
    });

    it('should throw NotFoundException if file not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.deleteFile('1')).rejects.toThrow(
          NotFoundException,
      );
    });
  });

  // findAll
  describe('findAll', () => {
    it('should return files', async () => {
      repo.find.mockResolvedValue([{ id: '1' }]);

      const result = await service.findAll();

      expect(result.length).toBe(1);
    });

    it('should throw on DB error', async () => {
      repo.find.mockRejectedValue(new Error('DB error'));

      await expect(service.findAll()).rejects.toThrow(
          InternalServerErrorException,
      );
    });
  });

  // findOne
  describe('findOne', () => {
    it('should return file', async () => {
      repo.findOne.mockResolvedValue({ id: '1' });

      const result = await service.findOne('1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(
          NotFoundException,
      );
    });
  });

  // uploadToCloud
  describe('uploadToCloud', () => {
    it('should upload to cloudinary', async () => {
      cloudinary.uploadFile.mockResolvedValue({ ok: true });

      const file = {
        originalname: 'test.png',
      } as Express.Multer.File;

      const result = await service.uploadToCloud(file);

      expect(result.ok).toBe(true);
    });

    it('should throw cloudinary error', async () => {
      cloudinary.uploadFile.mockRejectedValue(new Error('fail'));

      const file = {
        originalname: 'test.png',
      } as Express.Multer.File;

      await expect(service.uploadToCloud(file)).rejects.toThrow();
    });
  });
});