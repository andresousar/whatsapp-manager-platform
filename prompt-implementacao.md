# Prompt de Implementação — Plataforma de Gerenciamento de Mensagens WhatsApp (API Oficial Meta)

**Objetivo:** Gerar e subir um projeto profissional e moderno para operar mensagens via **WhatsApp Business Cloud API (Meta)** com múltiplos números, cadastro de agentes, histórico, transferência de conversas e dashboard em tempo real.

---

## Requisitos de Entrega (MVP – Sprint 1)
1. **Backend (NestJS + TypeScript)**
   - Autenticação JWT (access + refresh), RBAC (ADMIN, SUPERVISOR, AGENT).
   - Módulos: `auth, users, teams, numbers, contacts, conversations, messages, transfers, webhook, whatsapp`.
   - Prisma + PostgreSQL com schema conforme domínio.
   - Webhook **/webhook/whatsapp** (GET verify + POST receive) com verificação de `X-Hub-Signature-256` (HMAC-SHA256 com `WHATSAPP_APP_SECRET`).
   - Serviço WhatsApp: envio de texto (`/{GRAPH_VERSION}/{phone_number_id}/messages`), ingestão de mensagens recebidas, atualização de status (sent, delivered, read, failed).
   - WebSocket Gateway (socket.io) para eventos: `message:new`, `conversation:assigned`, `conversation:transferred`, `message:status`.

2. **Frontend (React + Vite + TypeScript + Tailwind + shadcn/ui)**
   - Páginas: Login, Dashboard (KPI básicos), Inbox (Minhas/Do Time/Não atribuídas), Conversa (thread + composer), Configurações (Usuários, Times, Números).
   - Cliente WebSocket conectado ao gateway.
   - Tema moderno, responsivo, dark mode.

3. **Infra**
   - `docker-compose.yml` com serviços: `db (postgres:16)`, `redis`, `api`, `web`.
   - `.env.example` com: `DATABASE_URL, WHATSAPP_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN, GRAPH_VERSION, JWT_SECRET`.
   - NGINX (dev opcional / prod), pass-through de WebSocket.

4. **Qualidade**
   - ESLint + Prettier, Husky (pre-commit).
   - Testes unitários básicos (Jest) para serviços de domínio.
   - README com passos para subir localmente e configurar webhook no painel da Meta.

---

## Critérios de Aceite
- Receber e persistir mensagem **INBOUND** via webhook e exibir em **Inbox/Conversa** em tempo real.
- Enviar **mensagem de texto** OUTBOUND para um contato existente e atualizar status pelo webhook.
- Transferir conversa entre agentes/times com log de auditoria.
- Dashboard: exibir **volume por hora**, **TPR** (tempo primeira resposta) e **backlog** (conversas abertas sem assignee).

---

## Roadmap (Próximas Sprints)
- Suporte completo a mídia (download/preview), templates, respostas rápidas.
- Relatórios CSV, filtros avançados, SLA configurável e roteamento inteligente.
- Webhooks de saída e integrações (CRM/ERP). Hardening e HA/K8s.

---

## Comandos Esperados
- Desenvolvimento:
  ```bash
  docker compose up -d
  # migrar prisma
  npx prisma migrate dev
  ```
- Seed inicial (usuário admin, time padrão, número de teste – simulado):
  ```bash
  node apps/api/prisma/seed.js
  ```

---

## Observações Meta (Cloud API)
- Mensagens **session** dentro de 24h não precisam de template; proativo só via **template aprovado**.
- URLs de mídia expiram; implementar job/worker para download e armazenamento.
- Respeitar **rate limits** com retry + backoff exponencial.
