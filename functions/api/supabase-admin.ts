
// Cloudflare Pages Function
// Path: /api/supabase-admin

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

    // Use fetch direct REST API call instead of supabase-js client to avoid build dependency issues
    // RPC Endpoint: POST https://<project_ref>.supabase.co/rest/v1/rpc/exec
    const baseUrl = projectUrl.replace(/\/$/, '');
    const rpcUrl = `${baseUrl}/rest/v1/rpc/exec`;

    const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ sql: query })
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) errorMessage = errorJson.message;
        } catch (e) {
            // keep raw text
        }
        console.error('Supabase admin error:', errorMessage);
        throw new Error(`Erro do Supabase (${response.status}): ${errorMessage}`);
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
