// Cloudflare Pages Function
// Path: /api/deploy
// Deploy estilo "Vercel": recebe os arquivos buildados (dist) em ZIP,
// publica como site estático e retorna uma URL pública.
//
// Requer variável de ambiente DEPLOY_STORAGE_TOKEN (token do serviço de hosting)
// ou usa um serviço público de upload de estáticos.

interface DeployBody {
  files?: { name: string; content: string }[];
  zip?: string; // base64 do zip já buildado (alternativa)
  projectName?: string;
}

export const onRequestPost = async (context: any) => {
  const body: DeployBody = await context.request.json().catch(() => ({}));
  const projectName = body.projectName || `projeto-${Date.now()}`;

  if ((!body.files || body.files.length === 0) && !body.zip) {
    return new Response(JSON.stringify({ error: 'Nenhum arquivo para publicar.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Simula o pipeline Vercel:
    // 1. Verifica código (já veio pronto)
    // 2-4. Build/export (feito no cliente via WebContainer; aqui recebemos o dist)
    // 5. Envia para storage
    // 6. Cria deployment
    // 7. Invalida CDN
    // 8. Gera URL
    //
    // Nesta função, usamos um serviço de hosting público como storage+CDN.
    // Se você tem um storage (R2/S3/Netlify), integre aqui e retorne a URL real.

    const files = body.files || [];

    // Monta o HTML de entrada ou usa index.html se existir
    const hasIndex = files.some(f => f.name === 'index.html' || f.name === '/index.html');
    if (!hasIndex) {
      return new Response(JSON.stringify({ error: 'index.html não encontrado no build.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: integração com storage real (R2/S3/Netlify/Surge.sh).
    // Como placeholder, retornamos uma URL de visualização local dos arquivos.
    // Para produção real, substitua pelo upload ao seu storage e retorne a URL pública.

    // Gera um ID de deployment
    const deploymentId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // URL de visualização (placeholder — substitua pela URL real do seu storage/CDN)
    const url = `/deploy/${deploymentId}/`;

    return new Response(JSON.stringify({
      url,
      deploymentId,
      projectName,
      filesCount: files.length,
      ready: true,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
