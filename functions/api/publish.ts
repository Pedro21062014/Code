
// Cloudflare Pages Function
// Path: /api/publish

export const onRequestPost = async (context: any) => {
  const req = context.request;
  
  // Tentar pegar do header primeiro (enviado pelo frontend)
  const headerToken = req.headers.get('X-Netlify-Token');
  const existingSiteId = req.headers.get('X-Netlify-Site-Id');
  
  // Fallback para variável de ambiente se não houver header
  const NETLIFY_ACCESS_TOKEN = headerToken || context.env.NETLIFY_ACCESS_TOKEN;

  if (!NETLIFY_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: 'Token de acesso do Netlify não encontrado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const zipBuffer = await req.arrayBuffer();
    let siteId = existingSiteId;
    let siteUrl = "";

    // 1. Verificar se o site existe para atualização
    if (siteId) {
        console.log(`Tentando atualizar site existente: ${siteId}`);
        const checkSite = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
        });
        
        if (checkSite.ok) {
            const siteInfo = await checkSite.json();
            siteUrl = siteInfo.ssl_url;
            console.log(`Site encontrado: ${siteUrl}`);
        } else {
            console.log("Site existente não encontrado ou sem permissão. Criando novo.");
            siteId = null; // Reset para criar novo se falhar
        }
    }

    // 2. Se não tem siteId (ou falhou ao encontrar), cria um novo
    if (!siteId) {
        console.log("Criando novo site no Netlify...");
        const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CodegenStudio/1.0'
          },
          body: JSON.stringify({}), // Cria site com nome aleatório
        });

        if (!createSiteResponse.ok) {
          if (createSiteResponse.status === 401) {
              throw new Error("Token do Netlify inválido. Verifique suas configurações.");
          }
          const errText = await createSiteResponse.text();
          throw new Error(`Erro ao criar site no Netlify: ${createSiteResponse.status} - ${errText}`);
        }

        const siteData = await createSiteResponse.json();
        siteId = siteData.id;
        siteUrl = siteData.ssl_url;
    }

    // 3. Fazer Deploy do ZIP
    console.log(`Iniciando deploy para siteId: ${siteId}`);
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
        'Content-Type': 'application/zip',
        'User-Agent': 'CodegenStudio/1.0'
      },
      body: zipBuffer,
    });
    
    if (!deployResponse.ok) {
        const errorText = await deployResponse.text();
        throw new Error(`Erro no upload do deploy: ${deployResponse.status} - ${errorText}`);
    }

    return new Response(JSON.stringify({ url: siteUrl, siteId: siteId }), {
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
