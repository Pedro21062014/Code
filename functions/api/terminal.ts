
export const onRequestPost = async (context: any) => {
  try {
    const { command } = await context.request.json();
    
    if (!command) {
        return new Response(JSON.stringify({ output: "" }), { headers: { "Content-Type": "application/json" }});
    }

    const args = command.trim().split(' ');
    const cmd = args[0].toLowerCase();
    
    let output = "";
    
    // Serverless Terminal Response (Generic Linux-like info)
    // Dependencies handling moved to Client-side (Sandpack)
    switch (cmd) {
        case 'whoami':
            output = "root@cloudflare-pages";
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
            output = "dist  functions  public  src  package.json";
            break;
        case 'status':
        case 'health':
            output = `[OK] Cloudflare Pages Function Active\nRegion: ${context.request.cf?.regionCode || 'Global'}\nTime: ${new Date().toISOString()}`;
            break;
        default:
            // For unknown commands or things like npm that slip through client-side check
            output = `bash: ${cmd}: command not found (remote)`;
    }

    return new Response(JSON.stringify({ output, user: "root", host: "cloud" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ output: `Error: ${e.message}` }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
