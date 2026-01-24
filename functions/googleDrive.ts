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
        const errorText = await folderResponse.text();
        console.error('Drive folder creation failed:', errorText);
        throw new Error(`Failed to create folder: ${folderResponse.status}`);
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

        if (!subfolderResponse.ok) {
          const errorText = await subfolderResponse.text();
          console.error('Subfolder creation failed:', errorText);
        }

        const subfolder_data = await subfolderResponse.json();
        subfolderIds[subfolder] = subfolder_data.id;
      }

      // Store folder IDs in project
      await base44.asServiceRole.entities.Project.update(projectId, {
        drive_folder_id: folder.id,
        drive_raw_folder_id: subfolderIds['Raw Files'],
        drive_edited_folder_id: subfolderIds['Edited Files']
      });

      return Response.json({ 
        success: true, 
        folderId: folder.id,
        rawFolderId: subfolderIds['Raw Files'],
        editedFolderId: subfolderIds['Edited Files']
      });
    }

    if (action === 'uploadFile') {
      // Upload file to Drive using resumable upload for better reliability
      const metadata = {
        name: fileName,
        parents: [folderId]
      };

      // Start resumable upload session
      const initResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        console.error('Failed to init upload:', errorText);
        throw new Error(`Failed to initialize upload: ${initResponse.status}`);
      }

      const uploadUrl = initResponse.headers.get('Location');

      // Decode base64 and upload file data
      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: bytes
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Failed to upload file: ${uploadResponse.status}`);
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
        const errorText = await response.text();
        console.error('List files failed:', errorText);
        throw new Error(`Failed to list files: ${response.status}`);
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