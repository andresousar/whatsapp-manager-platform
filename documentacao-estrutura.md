# Documentação — Árvore Estrutural do Projeto

Este documento descreve a **estrutura de pastas/arquivos** sugerida para o projeto “whatsapp-hub”.

```text
whatsapp-hub/
├─ apps/
│  ├─ api/                          # NestJS API + WebSocket
│  │  ├─ src/
│  │  │  ├─ main.ts
│  │  │  ├─ app.module.ts
│  │  │  ├─ prisma.service.ts
│  │  │  ├─ modules/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ users/
│  │  │  │  ├─ teams/
│  │  │  │  ├─ numbers/
│  │  │  │  ├─ contacts/
│  │  │  │  ├─ conversations/
│  │  │  │  ├─ messages/
│  │  │  │  ├─ transfers/
│  │  │  │  ├─ webhook/             # verificação + ingestão
│  │  │  │  └─ whatsapp/            # integração Graph API
│  │  │  └─ common/
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma
│  │  │  └─ seed.ts
│  │  ├─ package.json
│  │  └─ .env.example
│  └─ web/                          # React + Vite + shadcn/ui
│     ├─ src/
│     │  ├─ app.tsx
│     │  ├─ pages/
│     │  │  ├─ login.tsx
│     │  │  ├─ dashboard.tsx
│     │  │  ├─ inbox.tsx
│     │  │  ├─ conversation.tsx
│     │  │  └─ settings/
│     │  ├─ components/
│     │  │  ├─ ChatThread.tsx
│     │  │  ├─ TransferDialog.tsx
│     │  │  └─ KPICards.tsx
│     │  └─ lib/socket.ts
│     ├─ index.html
│     └─ package.json
├─ deploy/
│  ├─ docker-compose.yml
│  ├─ nginx.conf
│  └─ k8s/                          # manifests (opcional)
├─ .editorconfig
├─ .gitignore
└─ README.md
```

## Descrição dos Principais Diretórios

- **apps/api/src/modules/**
  - **auth/**: DTOs, guards, strategies (JWT), controller/service para login/refresh/logout.
  - **users/**: CRUD de usuários e RBAC.
  - **teams/**: times/filas de atendimento e membros.
  - **numbers/**: cadastro de `phone_number_id`, WABA, status.
  - **contacts/**: contatos (WA ID/telefone), perfis.
  - **conversations/**: abertura/fechamento, assignee atual, índices por status/última mensagem.
  - **messages/**: envio, normalização de tipos (text, image, audio, video, document, interactive…).
  - **transfers/**: transferência agente→agente e agente→time, auditoria.
  - **webhook/**: verificação GET (hub.challenge) + POST (payload + assinatura).
  - **whatsapp/**: cliente Graph API, helpers, retries, download de mídia.
- **apps/api/prisma/**: `schema.prisma`, migrations e seed.
- **apps/web/**: SPA com rotas principais, componentes e cliente WebSocket.
- **deploy/**: orquestração (compose/k8s) e `nginx.conf` (reverse proxy, TLS, WebSocket).

## Variáveis de Ambiente (/.env.example)
```ini
DATABASE_URL=postgresql://app:app@localhost:5432/whatsapp
WHATSAPP_TOKEN=EAAG...      # token de acesso Cloud API
WHATSAPP_APP_SECRET=change_me
WHATSAPP_VERIFY_TOKEN=choose_a_token
GRAPH_VERSION=v20.0
JWT_SECRET=supersecret
```

## Comandos Básicos
```bash
# subir stack
docker compose up -d

# gerar cliente prisma e rodar migrações
npx prisma generate
npx prisma migrate dev
```
