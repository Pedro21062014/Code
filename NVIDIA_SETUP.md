# Configuração da API NVIDIA (provedor padrão dos modelos)

Os modelos gratuitos do Codegen Studio agora usam a **API NVIDIA**
(`https://integrate.api.nvidia.com/v1`, compatível com OpenAI) por trás — sem
exibir isso na interface.

## 🔑 Variável de ambiente

```
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxx
```

Você cria sua key grátis em: **https://build.nvidia.com** (não pede cartão de
crédito; inclui vários modelos gratuitos com ~40 requisições/min).

### Onde configurar (Cloudflare Pages)

1. **Cloudflare Pages → seu projeto → Settings → Environment variables**.
2. Adicione:
   - **Variable name:** `NVIDIA_API_KEY`
   - **Value:** `nvapi-...`
   - **Type:** `Secret`
3. Salve e **redeploy**.

### Local (wrangler dev)

Adicione no arquivo `.dev.vars` (já está no `.gitignore`):

```
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxx
```

## Como funciona

1. Os modelos listados em `constants.ts` têm `provider: AIProvider.Nvidia`.
2. Ao gerar, o app chama `POST /api/generate`
   (`functions/api/generate.ts`), que usa a `NVIDIA_API_KEY` do servidor
   (escondida — o app nunca expõe a chave).
3. Se o usuário tiver a própria chave `nvapi-` salva nas configurações
   (`nvidia_api_key`), o cliente chama a NVIDIA direto
   (`services/nvidiaService.ts`).

## Modelos gratuitos incluídos

| Modelo (id)                              | Nome exibido         |
| ---------------------------------------- | -------------------- |
| `deepseek-ai/deepseek-v4-flash`          | DeepSeek V4 Flash    |
| `moonshotai/kimi-k2.6`                   | Kimi K2.6            |
| `minimaxai/minimax-m2.7`                 | MiniMax M2.7         |
| `meta/llama-4-maverick-17b-128e-instruct`| Llama 4 Maverick     |
| `mistralai/mistral-large-3-675b-instruct-2512` | Mistral Large 3 |
| `nvidia/nemotron-3-super-120b-a12b`      | Nemotron 3 Super     |
| `deepseek-ai/deepseek-v4-pro`            | DeepSeek V4 Pro      |

Todos rodam pela mesma `NVIDIA_API_KEY`.

## Arquivos alterados

- `types.ts` — provider `Nvidia` + campo `nvidia_api_key`
- `constants.ts` — modelos NVIDIA
- `services/nvidiaService.ts` — chamada client-side (nova)
- `services/aiService.ts` — dispatch do provider NVIDIA
- `functions/api/generate.ts` — proxy NVIDIA no servidor
- `App.tsx` — usa `nvidia_api_key`
- removidos: `openRouterService.ts` e dead codes (claude/kimi/qwen/zai) que usavam OpenRouter
