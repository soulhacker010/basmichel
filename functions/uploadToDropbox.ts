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

    const accessToken = Deno.env.get('DROPBOX_ACCESS_TOKEN');
    
    if (!accessToken) {
      return Response.json({ error: 'Dropbox not configured' }, { status: 500 });
    }

    // Upload file to Dropbox
    const fileBytes = await file.arrayBuffer();
    const path = `/${folder}/${file.name}`;

    const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: path,
          mode: 'add',
          autorename: true,
          mute: false,
        }),
      },
      body: fileBytes,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Dropbox upload failed:', errorText);
      throw new Error(`Upload failed: ${errorText}`);
    }

    const uploadedFile = await uploadResponse.json();

    // Create a shared link for the file
    const sharedLinkResponse = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: uploadedFile.path_display,
        settings: {
          requested_visibility: 'public',
        },
      }),
    });

    let sharedLink = '';
    if (sharedLinkResponse.ok) {
      const linkData = await sharedLinkResponse.json();
      // Convert to direct download link
      sharedLink = linkData.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    } else {
      // Try to get existing link
      const listLinksResponse = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: uploadedFile.path_display,
        }),
      });

      if (listLinksResponse.ok) {
        const linksData = await listLinksResponse.json();
        if (linksData.links && linksData.links.length > 0) {
          sharedLink = linksData.links[0].url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
        }
      }
    }

    return Response.json({
      file_url: sharedLink || uploadedFile.path_display,
      download_url: sharedLink || uploadedFile.path_display,
      dropbox_path: uploadedFile.path_display,
      filename: uploadedFile.name,
      size: uploadedFile.size,
      mime_type: file.type,
    });
  } catch (error) {
    console.error('Dropbox upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});