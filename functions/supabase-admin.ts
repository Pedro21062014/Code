import { createClient } from '@supabase/supabase-js';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { projectUrl, serviceKey, query } = await req.json();

    if (!projectUrl || !serviceKey || !query) {
      return new Response(JSON.stringify({ error: 'Faltando projectUrl, serviceKey ou query.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with admin privileges on the fly
    const supabaseAdmin = createClient(projectUrl, serviceKey);
    
    // Execute the raw SQL query
    const { error } = await supabaseAdmin.rpc('exec', { sql: query });
    
    if (error) {
      console.error('Supabase admin error:', error);
      throw new Error(`Erro do Supabase: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Consulta executada com sucesso.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função supabase-admin:', error);
    const message = error instanceof Error ? error.message : "Ocorreu um erro desconhecido no servidor.";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: "/api/supabase-admin",
};
