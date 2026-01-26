
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

// Initialize S3 Client for Cloudflare R2
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL"); // Optional: Custom domain or R2.dev URL

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

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

    const { action, fileName, fileType, fileKey } = await req.json();

    // 1. Get Presigned URL for Upload (PUT)
    if (action === "getPresignedUrl") {
      if (!fileName || !fileType) {
        return Response.json({ error: "Missing fileName or fileType" }, { status: 400 });
      }

      const key = `${crypto.randomUUID()}-${fileName}`;
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });

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

        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
        });

        await S3.send(command);
        return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("R2 Storage Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
