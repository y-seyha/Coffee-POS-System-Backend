import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import {memoryStorage} from "multer";
import {MulterModule} from "@nestjs/platform-express";
import {CloudinaryModule} from "./cloudinary/cloudinary.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {File} from "../common/entities/file_upload.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    CloudinaryModule,
    MulterModule.register({
      storage : memoryStorage(),
    })
  ],
  providers: [FileUploadService],
  controllers: [FileUploadController],
  exports : [FileUploadService],
})
export class FileUploadModule {}
