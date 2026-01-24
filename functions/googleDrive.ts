import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { action, projectId, projectNumber, fileName, fileData, folderId } = await req.json();
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googledrive");

    if (action === 'createFolder') {
      // Create main project folder
      const folderMetadata = {
        name: `Project ${projectNumber}`,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(folderMetadata)
      });

      if (!folderResponse.ok) {
        throw new Error('Failed to create folder');
      }

      const folder = await folderResponse.json();

      // Create subfolders
      const subfolders = ['Raw Files', 'Edited Files'];
      const subfolderIds = {};

      for (const subfolder of subfolders) {
        const subfolderMetadata = {
          name: subfolder,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [folder.id]
        };

        const subfolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subfolderMetadata)
        });

        const subfolder_data = await subfolderResponse.json();
        subfolderIds[subfolder] = subfolder_data.id;
      }

      // Store folder IDs in project
      await base44.asServiceRole.entities.Project.update(projectId, {
        notes: JSON.stringify({
          drive_folder_id: folder.id,
          drive_raw_folder_id: subfolderIds['Raw Files'],
          drive_edited_folder_id: subfolderIds['Edited Files']
        })
      });

      return Response.json({ 
        success: true, 
        folderId: folder.id,
        rawFolderId: subfolderIds['Raw Files'],
        editedFolderId: subfolderIds['Edited Files']
      });
    }

    if (action === 'uploadFile') {
      // Upload file to Drive
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadata = {
        name: fileName,
        parents: [folderId]
      };

      // Decode base64 file data
      const fileBytes = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/octet-stream\r\n\r\n' +
        fileData +
        close_delim;

      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`
        },
        body: multipartRequestBody
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const file = await uploadResponse.json();
      return Response.json({ success: true, fileId: file.id });
    }

    if (action === 'listFiles') {
      // List files in folder
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size,webViewLink,webContentLink)`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to list files');
      }

      const data = await response.json();
      return Response.json({ success: true, files: data.files || [] });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Google Drive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});