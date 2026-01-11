
// Cloudflare Pages Function
// Path: /api/publish

export const onRequestPost = async (context: any) => {
  const req = context.request;
  
  // Tentar pegar do header primeiro (enviado pelo frontend)
  const headerToken = req.headers.get('X-Netlify-Token');
  
  // Fallback para variável de ambiente se não houver header
  const NETLIFY_ACCESS_TOKEN = headerToken || context.env.NETLIFY_ACCESS_TOKEN;

  if (!NETLIFY_ACCESS_TOKEN) {
    console.error('Netlify access token is not configured.');
    return new Response(JSON.stringify({ error: 'Token de acesso do Netlify não encontrado. Por favor, configure nas integrações ou forneça manualmente.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
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
      if (createSiteResponse.status === 401) {
          throw new Error("Token do Netlify inválido ou expirado.");
      }
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
        // Tenta limpar o site criado se o deploy falhar
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
