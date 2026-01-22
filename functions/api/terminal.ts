
export const onRequestPost = async (context: any) => {
  try {
    const { command } = await context.request.json();
    
    if (!command) {
        return new Response(JSON.stringify({ output: "" }), { headers: { "Content-Type": "application/json" }});
    }

    const args = command.trim().split(' ');
    const cmd = args[0].toLowerCase();
    
    let output = "";
    
    // Simulação de Shell Server-Side no ambiente V8 Worker
    switch (cmd) {
        case 'whoami':
            output = "root@cloudflare-edge";
            break;
        case 'uname':
            output = `Cloudflare Pages / V8 Isolation (${context.request.cf?.httpProtocol || 'HTTP'})`;
            break;
        case 'uname -a':
            output = `Linux cloudflare-edge 5.10.0 #1 SMP V8 Isolation`;
            break;
        case 'date':
            output = new Date().toString();
            break;
        case 'pwd':
            output = "/var/task/worker";
            break;
        case 'id':
            output = "uid=0(root) gid=0(root) groups=0(root)";
            break;
        case 'echo':
            output = args.slice(1).join(' ');
            break;
        case 'env':
            output = `NODE_ENV=production\nCF_REGION=${context.request.cf?.region || "unknown"}\nCF_CITY=${context.request.cf?.city || "unknown"}\nWORKER_TYPE=pages-function`;
            break;
        case 'ip':
        case 'ifconfig':
            output = `Client IP: ${context.request.headers.get('CF-Connecting-IP') || '127.0.0.1'}`;
            break;
        case 'status':
        case 'health':
            output = `[OK] Service Online\nRegion: ${context.request.cf?.regionCode || 'N/A'}\nTime: ${new Date().toISOString()}`;
            break;
        case 'help':
            output = "Supported Server Commands:\n  whoami, uname, date, pwd, echo, env, ip, health\n\nLocal Commands:\n  ls, cat, clear";
            break;
        default:
            output = `bash: ${cmd}: command not found (on server)`;
    }

    return new Response(JSON.stringify({ output, user: "root", host: "edge" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ output: `Error: ${e.message}` }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
