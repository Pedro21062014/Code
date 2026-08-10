// Cloudflare Pages Function
// Path: /api/deploy
// Deploy estilo "Vercel" usando Supabase Storage como storage/CDN.
//
// Requer variáveis de ambiente no Cloudflare Pages:
//   SUPABASE_URL = https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY = <service_role key>
//   SUPABASE_DEPLOY_BUCKET = deployments (opcional)

import { createClient } from '@supabase/supabase-js';

interface DeployBody {
  files?: { name: string; content: string }[];
  projectName?: string;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.map': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.wasm': 'application/wasm',
  '.md': 'text/markdown; charset=utf-8',
};

function mimeFor(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot >= 0) {
    const ext = name.slice(dot).toLowerCase();
    if (MIME[ext]) return MIME[ext];
  }
  return 'application/octet-stream';
}

export const onRequestPost = async (context: any) => {
  const SUPABASE_URL = context.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = context.env.SUPABASE_SERVICE_ROLE_KEY;
  const BUCKET = context.env.SUPABASE_DEPLOY_BUCKET || 'deployments';

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configurados.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body: DeployBody = await context.request.json().catch(() => ({}));
  const projectName = body.projectName || `projeto-${Date.now()}`;
  const files = body.files || [];

  if (files.length === 0) {
    return new Response(JSON.stringify({ error: 'Nenhum arquivo para publicar.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hasIndex = files.some(f => f.name === 'index.html' || f.name === '/index.html');
  if (!hasIndex) {
    return new Response(JSON.stringify({ error: 'index.html não encontrado no build.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Cliente com service role (admin) — seguro no servidor
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Garante que o bucket existe
    const { error: bucketError } = await supabase.storage.getBucket(BUCKET);
    if (bucketError) {
      // tenta criar (público)
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
      if (createErr && !String(createErr.message).includes('already exists')) {
        throw new Error(`Falha ao criar bucket: ${createErr.message}`);
      }
    }

    const deploymentId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Sobe cada arquivo para /<deploymentId>/<path>
    for (const f of files) {
      const clean = f.name.startsWith('/') ? f.name.slice(1) : f.name;
      const path = `${deploymentId}/${clean}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, f.content, { contentType: mimeFor(clean), upsert: true });
      if (error && !String(error.message).includes('Duplicate')) {
        console.warn('Upload falhou (continuando):', clean, error.message);
      }
    }

    // URL pública base
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(`${deploymentId}/index.html`);
    const baseUrl = urlData?.publicUrl ? urlData.publicUrl.split('/index.html')[0] : '';

    return new Response(JSON.stringify({
      url: baseUrl,
      indexUrl: urlData?.publicUrl || '',
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
