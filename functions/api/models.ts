
// Cloudflare Pages Function
// Path: /api/models

export const onRequestGet = async (context: any) => {
  try {
    // Tenta pegar a chave do cabeçalho da requisição (se o usuário forneceu nas configs)
    // Se não, usa a do ambiente do servidor
    const userKey = context.request.headers.get('X-OpenRouter-Key');
    const apiKey = userKey || context.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return new Response(JSON.stringify({ 
            error: 'Nenhuma chave API configurada (Server ou User).' 
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://codegen.studio',
        'X-Title': 'Codegen Studio',
      }
    });

    if (!response.ok) {
        return new Response(JSON.stringify({ error: `Erro ao buscar modelos` }), { status: response.status });
    }

    const data = await response.json();
    
    // Cachear a resposta por 1 hora para economizar chamadas
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', 
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
