
// Cloudflare Pages Function
// Path: /api/publish

export const onRequestPost = async (context: any) => {
  // Use context.env para acessar variáveis de ambiente no Cloudflare Pages
  const NETLIFY_ACCESS_TOKEN = context.env.NETLIFY_ACCESS_TOKEN || 'nfp_cUTkdat2opM1aRfHScATH86T8nLRL27Y25e8'; // Fallback apenas se necessário, idealmente configure no dashboard

  if (!NETLIFY_ACCESS_TOKEN) {
    console.error('Netlify access token is not configured.');
    return new Response(JSON.stringify({ error: 'O serviço de publicação não está configurado no servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const req = context.request;
    const zipBuffer = await req.arrayBuffer();

    const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const siteData = await createSiteResponse.json();

    if (!createSiteResponse.ok) {
      const errorMessage = siteData?.message || `Netlify API error (create site): ${createSiteResponse.statusText}`;
      throw new Error(errorMessage);
    }
    
    const siteId = siteData.id;
    const siteUrl = siteData.ssl_url;

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
        await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
        });
        throw new Error(errorMessage);
    }

    return new Response(JSON.stringify({ url: siteUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro na função de publicação:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
