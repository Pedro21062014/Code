
export const onRequestPost = async (context: any) => {
  try {
    const { command } = await context.request.json();
    
    if (!command) {
        return new Response(JSON.stringify({ output: "" }), { headers: { "Content-Type": "application/json" }});
    }

    const args = command.trim().split(' ');
    const cmd = args[0].toLowerCase();
    
    let output = "";
    
    // Este terminal roda no Cloudflare Workers (Serverless).
    // Não é possível manter estado ou rodar 'npm install' aqui.
    switch (cmd) {
        case 'whoami':
            output = "root@cloudflare-pages-function";
            break;
        case 'uname':
            output = `Cloudflare V8 Runtime (Serverless)`;
            break;
        case 'date':
            output = new Date().toString();
            break;
        case 'pwd':
            output = "/var/task";
            break;
        case 'ls':
            output = "Aviso: Este é um ambiente serverless efêmero. Seus arquivos do projeto estão no navegador (client-side), não neste servidor.";
            break;
        case 'npm':
        case 'node':
        case 'yarn':
        case 'pnpm':
            output = `\x1b[33m[SERVERLESS ALERT]\x1b[0m\nEste terminal está conectado ao backend Cloudflare.\nPara rodar comandos do projeto (como 'npm install' ou 'npm run dev'), observe que eles são executados automaticamente pelo ambiente de Preview (Sandpack) no seu navegador.\n\nO servidor backend não persiste arquivos.`;
            break;
        case 'status':
        case 'health':
            output = `[OK] Cloudflare Pages Function Active\nRegion: ${context.request.cf?.regionCode || 'Global'}\nTime: ${new Date().toISOString()}`;
            break;
        case 'help':
            output = `
Cloudflare Pages Terminal
-------------------------
Comandos disponíveis: whoami, uname, date, status, health

NOTA: Para comandos de build (npm, node), utilize a visualização de código. 
O projeto roda em um container Node.js dentro do seu navegador.
`;
            break;
        default:
            output = `bash: ${cmd}: command not found (no ambiente serverless)`;
    }

    return new Response(JSON.stringify({ output, user: "root", host: "cloud" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ output: `Error: ${e.message}` }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
