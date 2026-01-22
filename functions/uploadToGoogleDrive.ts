import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'Basmichel Projects';

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get Google Drive access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // First, create or find the folder
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${folder}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const searchData = await searchResponse.json();
    let folderId;

    if (searchData.files && searchData.files.length > 0) {
      folderId = searchData.files[0].id;
    } else {
      // Create folder
      const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folder,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      const folderData = await createFolderResponse.json();
      folderId = folderData.id;
    }

    // Upload file to Google Drive
    const fileBytes = await file.arrayBuffer();
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metadata = {
      name: file.name,
      parents: [folderId],
      mimeType: file.type || 'application/octet-stream',
    };

    const metadataStr = JSON.stringify(metadata);
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadataStr +
      delimiter +
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

    const multipartBody = new Uint8Array(
      new TextEncoder().encode(multipartRequestBody).length +
      fileBytes.byteLength +
      new TextEncoder().encode(closeDelim).length
    );

    let offset = 0;
    const encoder = new TextEncoder();
    const headerBytes = encoder.encode(multipartRequestBody);
    multipartBody.set(headerBytes, offset);
    offset += headerBytes.length;

    multipartBody.set(new Uint8Array(fileBytes), offset);
    offset += fileBytes.byteLength;

    const delimBytes = encoder.encode(closeDelim);
    multipartBody.set(delimBytes, offset);

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', errorText);
      throw new Error(`Upload failed: ${errorText}`);
    }

    const uploadedFile = await uploadResponse.json();

    // Make file accessible via link
    const permResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    if (!permResponse.ok) {
      console.error('Permission setting failed:', await permResponse.text());
    }

    const fileUrl = `https://drive.google.com/file/d/${uploadedFile.id}/view`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${uploadedFile.id}`;

    return Response.json({
      file_url: fileUrl,
      download_url: downloadUrl,
      drive_id: uploadedFile.id,
      filename: file.name,
      size: file.size,
      mime_type: file.type,
    });
  } catch (error) {
    console.error('Google Drive upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});