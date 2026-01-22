
export const onRequest = async (context: any) => {
  // Exemplo de como acessar informações da requisição ou variáveis
  const url = new URL(context.request.url);
  
  return new Response(JSON.stringify({
    status: "online",
    message: "O servidor Cloudflare Functions está rodando perfeitamente!",
    timestamp: new Date().toISOString(),
    location: context.request.cf?.city || "Localhost"
  }), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
};
