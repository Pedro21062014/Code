// This serverless function handles deploying project files to Netlify.
// The client is responsible for zipping the files and sending the blob.

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const NETLIFY_ACCESS_TOKEN = 'nfp_cUTkdat2opM1aRfHScATH86T8nLRL27Y25e8';

  if (!NETLIFY_ACCESS_TOKEN) {
    console.error('Netlify access token is not configured.');
    return new Response(JSON.stringify({ error: 'O serviço de publicação não está configurado no servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // The body of the request is the zip file itself
    const zipBuffer = await req.arrayBuffer();

    // Step 1: Create a new site on Netlify
    const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Create with a random name
    });

    const siteData = await createSiteResponse.json();

    if (!createSiteResponse.ok) {
      const errorMessage = siteData?.message || `Netlify API error (create site): ${createSiteResponse.statusText}`;
      throw new Error(errorMessage);
    }
    
    const siteId = siteData.id;
    const siteUrl = siteData.ssl_url;

    // Step 2: Deploy the zip file to the new site
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
        'Content-Type': 'application/zip',
      },
      body: zipBuffer,
    });
    
    if (!deployResponse.ok) {
        const errorBody = await deployResponse.json();
        const errorMessage = errorBody?.message || `Netlify API error (deploy): ${deployResponse.statusText}`;
        // Attempt to clean up by deleting the created site
        await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
        });
        throw new Error(errorMessage);
    }

    // The deployment is async, but we can return the URL right away.
    // Netlify will show a "deploying" message on the site itself.
    
    return new Response(JSON.stringify({ url: siteUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função de publicação:', error);
    const message = error instanceof Error ? error.message : "An unknown server error occurred.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: "/api/publish",
};