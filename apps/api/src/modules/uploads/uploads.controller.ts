import { Body, Controller, Post } from "@nestjs/common";
import { IsString } from "class-validator";

class PresignDto {
  @IsString() filename!: string;
  @IsString() contentType!: string;
}

// Issues a presigned PUT URL for direct browser → S3/MinIO upload.
// Real implementation uses `@aws-sdk/s3-request-presigner`; stub returns the local
// MinIO PUT URL so the FE create-listing flow can be wired end-to-end.
@Controller("uploads")
export class UploadsController {
  @Post("presign")
  presign(@Body() dto: PresignDto) {
    const endpoint = process.env.S3_ENDPOINT ?? "http://localhost:9000";
    const bucket = process.env.S3_BUCKET ?? "compralo-uploads";
    const key = `uploads/${Date.now()}-${dto.filename}`;
    return {
      uploadUrl: `${endpoint}/${bucket}/${key}`,
      publicUrl: `${endpoint}/${bucket}/${key}`,
      key,
    };
  }
}
