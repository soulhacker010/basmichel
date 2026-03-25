import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from "https://esm.sh/@aws-sdk/client-s3@3.525.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.525.0";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

// Lazy load S3 Client to prevent top-level crashes if env vars are missing during build/init
let S3 = null;

function getS3Client() {
  if (S3) return S3;

  const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
  const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
  const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 Secrets (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY) are missing in environment variables.");
  }

  S3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return S3;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, fileName, fileType, fileKey, uploadId, parts, numParts } = await req.json();

    // 1. Create Multipart Upload (for large files)
    if (action === "createMultipartUpload") {
      if (!fileName || !fileType) {
        return Response.json({ error: "Missing fileName or fileType" }, { status: 400 });
      }

      const key = `${crypto.randomUUID()}-${fileName}`;
      const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
      const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL");

      if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not set");

      const command = new CreateMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });

      const result = await getS3Client().send(command);

      return Response.json({
        success: true,
        uploadId: result.UploadId,
        fileKey: key,
        publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : null,
      });
    }

    // 2. Get Presigned URLs for Parts
    if (action === "getPartPresignedUrls") {
      if (!fileKey || !uploadId || !numParts) {
        return Response.json({ error: "Missing fileKey, uploadId, or numParts" }, { status: 400 });
      }

      const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
      if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not set");

      const presignedUrls = [];
      for (let partNumber = 1; partNumber <= numParts; partNumber++) {
        const command = new UploadPartCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        const url = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
        presignedUrls.push({ partNumber, url });
      }

      return Response.json({ success: true, presignedUrls });
    }

    // 3. Complete Multipart Upload
    if (action === "completeMultipartUpload") {
      if (!fileKey || !uploadId || !parts) {
        return Response.json({ error: "Missing fileKey, uploadId, or parts" }, { status: 400 });
      }

      const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
      if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not set");

      const command = new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      });

      await getS3Client().send(command);
      return Response.json({ success: true });
    }

    // 4. Get Presigned URL for Upload (PUT) - for small files
    if (action === "getPresignedUrl") {
      if (!fileName || !fileType) {
        return Response.json({ error: "Missing fileName or fileType" }, { status: 400 });
      }

      const key = `${crypto.randomUUID()}-${fileName}`;
      const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
      const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL");

      if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not set");

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });

      return Response.json({
        success: true,
        uploadUrl,
        fileKey: key,
        publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : null,
      });
    }

    // 2. Delete File
    if (action === "deleteFile") {
      if (!fileKey) {
        return Response.json({ error: "Missing fileKey" }, { status: 400 });
      }

      // Optional: specific role check?
      // if (user.role !== 'admin') ...

      const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
      if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not set");

      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      });

      await getS3Client().send(command);
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("R2 Storage Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
