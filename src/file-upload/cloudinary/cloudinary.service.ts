import {Inject, Injectable} from "@nestjs/common";
import {UploadApiResponse, UploadApiErrorResponse} from 'cloudinary';
import * as streamifier from 'streamifier';
@Injectable()
export class CloudinaryService {
    constructor(
        @Inject('CLOUDINARY')
        private readonly  cloudinary : any,
    ) {
    }

    uploadFile(file : Express.Multer.File) : Promise<UploadApiResponse> {
        return  new Promise((resolve, reject) => {
            const uploadStream = this.cloudinary.uploader.upload_stream(
                {
                    folder : 'nestjs_coffee_pos',
                    resource_type : 'auto'
                },
                (error : UploadApiErrorResponse, result : UploadApiResponse) => {
                    if(error)
                        return reject(error);

                    resolve(result);
                }
            )

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        })
    }

    async  deleteFile(publicId : string) : Promise<any>{
        return this.cloudinary.uploader.destroy(publicId);
    }
}