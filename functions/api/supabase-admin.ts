
// Cloudflare Pages Function
// Path: /api/supabase-admin

import { createClient } from '@supabase/supabase-js';

export const onRequestPost = async (context: any) => {
  try {
    const req = context.request;
    const { projectUrl, serviceKey, query } = await req.json();

    if (!projectUrl || !serviceKey || !query) {
      return new Response(JSON.stringify({ error: 'Faltando projectUrl, serviceKey ou query.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(projectUrl, serviceKey);
    
    const { error } = await supabaseAdmin.rpc('exec', { sql: query });
    
    if (error) {
      console.error('Supabase admin error:', error);
      throw new Error(`Erro do Supabase: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Consulta executada com sucesso.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro na função supabase-admin:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
