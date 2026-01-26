
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Re-using the storage logic would be ideal, but for now we'll implement direct R2 deletion or call the storage function if possible.
// Since we are in the same environment, we can use the same R2 credentials.
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "npm:@aws-sdk/client-s3";

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");

const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || "",
        secretAccessKey: R2_SECRET_ACCESS_KEY || "",
    },
});

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Strict Admin Check
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const { action } = await req.json();

        if (action === 'runCleanup') {
            const verbose = [];

            // 1. Find Projects marked 'sold' older than 14 days
            // Note: Base44 list filtering might be limited, so we might need to fetch sold projects and filter in code if date comparison isn't supported directly in filter syntax.
            // Assuming we can filter by status first.
            const soldProjects = await base44.entities.Project.filter({ status: 'sold' });

            const now = new Date();
            const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

            const projectsToDelete = soldProjects.filter(p => {
                if (!p.sold_date) return false;
                return new Date(p.sold_date) < fourteenDaysAgo;
            });

            verbose.push(`Found ${projectsToDelete.length} projects to cleanup.`);

            for (const project of projectsToDelete) {
                verbose.push(`Cleaning up Project: ${project.title} (${project.id})`);

                // 2. Find and Delete Files (R2 + DB)
                const projectFiles = await base44.entities.ProjectFile.filter({ project_id: project.id });

                for (const file of projectFiles) {
                    if (file.file_key) {
                        try {
                            const command = new DeleteObjectCommand({
                                Bucket: R2_BUCKET_NAME,
                                Key: file.file_key,
                            });
                            await S3.send(command);
                            verbose.push(`-- Deleted R2 file: ${file.file_key}`);
                        } catch (e) {
                            verbose.push(`-- Error deleting R2 file ${file.file_key}: ${e.message}`);
                        }
                    }
                    // Delete ProjectFile entity
                    await base44.entities.ProjectFile.delete(file.id);
                }

                // 3. Update Project Entity (Keep as Invoice Record)
                // We DO NOT delete the project. We mark it as 'archived_sold' so it stays as an invoice record.
                await base44.entities.Project.update(project.id, {
                    status: 'sold_archived',
                    // Optional: Clear other fields if needed to save DB space, but for an invoice record, keeping metadata is usually desired.
                });
                verbose.push(`-- Updated Project status to 'sold_archived' (Kept as Invoice Record)`);
            }

            return Response.json({
                success: true,
                deletedCount: projectsToDelete.length,
                log: verbose
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Cleanup Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
