import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderName } = await req.json();

    if (!folderName) {
      return Response.json({ error: 'No folder name provided' }, { status: 400 });
    }

    const accessToken = Deno.env.get('DROPBOX_ACCESS_TOKEN');
    
    if (!accessToken) {
      return Response.json({ error: 'Dropbox not configured' }, { status: 500 });
    }

    // Create folder in Dropbox
    const createFolderResponse = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/${folderName}`,
        autorename: false,
      }),
    });

    if (!createFolderResponse.ok) {
      const errorText = await createFolderResponse.text();
      console.error('Dropbox folder creation failed:', errorText);
      
      // If folder already exists, that's okay
      if (errorText.includes('path/conflict')) {
        return Response.json({ 
          success: true, 
          message: 'Folder already exists',
          path: `/${folderName}` 
        });
      }
      
      throw new Error(`Folder creation failed: ${errorText}`);
    }

    const folderData = await createFolderResponse.json();

    return Response.json({
      success: true,
      path: folderData.metadata.path_display,
      folder_id: folderData.metadata.id,
    });
  } catch (error) {
    console.error('Dropbox folder creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});