# Integração E2B (execução de código + preview ao vivo)

O Codegem Studio usa o **E2B** para que a IA execute os comandos gerados
(`terminalCommands`) num sandbox em nuvem e o preview ao vivo funcione de verdade
(instalar dependências, rodar `npm run dev`, servir arquivos estáticos etc).

## 🔑 Variável de ambiente

A única variável necessária é:

```
E2B_API_KEY=e2b_xxxxxxxxxxxxxxxx
```

Você pega sua key em: **https://e2b.dev/dashboard?tab=keys**

### Onde configurar (Cloudflare Pages)

1. No dashboard do **Cloudflare Pages** → seu projeto **Codegen Studio**.
2. Vá em **Settings → Environment variables**.
3. Adicione:
   - **Variable name:** `E2B_API_KEY`
   - **Value:** `e2b_...`
   - **Type:** `Secret` (recomendado)
4. Salve e **redeploy**.

### Local (wrangler dev)

Crie um arquivo `.dev.vars` na raiz do projeto:

```
E2B_API_KEY=e2b_xxxxxxxxxxxxxxxx
```

> `.dev.vars` já está no `.gitignore` — não commitar a key.

### Compat flag obrigatório

A SDK do E2B usa módulos do Node (`node:fs`, `node:path`, etc.), então a
compatibility flag `nodejs_compat` precisa estar ativa. Já configuramos isso no
`wrangler.toml`.

## Como funciona

1. A IA gera o código e retorna, no JSON, um array `terminalCommands`
   (ex.: `["npm install", "npm run dev -- --host 0.0.0.0 --port 3000"]`).
2. Ao terminar a geração, o app chama **`POST /api/e2b`**
   (`functions/api/e2b.ts`), que:
   - cria um sandbox E2B;
   - escreve todos os arquivos do projeto no filesystem;
   - executa os comandos de setup (foreground) e o servidor (background);
   - retorna `{ previewUrl, sandboxId, port }`.
3. O `EditorView` mostra a `previewUrl` no painel de preview (iframe ao vivo) e um
   badge "Preview E2B ao vivo".

## Arquivos

| Arquivo                        | Papel                                                       |
| ------------------------------ | ----------------------------------------------------------- |
| `functions/api/e2b.ts`         | Function Cloudflare que cria/executa/mata o sandbox E2B     |
| `services/e2bService.ts`       | Helpers do cliente (`startE2bPreview`, `killE2bSandbox`)    |
| `wrangler.toml`                | `nodejs_compat` + `pages_build_output_dir`                  |
| `App.tsx`                      | Dispara o E2B após a geração e passa a URL ao EditorView    |

## Limpeza

Sandboxes são efêmeros e expiram sozinhos (timeout padrão de 1h nesta integração).
Também matamos o sandbox anterior sempre que uma nova geração acontece.
