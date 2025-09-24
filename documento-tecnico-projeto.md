# Documento Técnico — Plataforma de Gerenciamento de Mensagens WhatsApp (API Oficial Meta)

## 1. Visão Geral
Sistema para centralizar operações via **WhatsApp Business Cloud API**: múltiplos números, agentes/filas, histórico íntegro, transferência de conversas, métricas e tempo real (WebSocket).

## 2. Arquitetura
- **Backend:** NestJS (TypeScript), módulos por domínio, validação (class-validator), DTOs, Guards, Interceptors.
- **Banco:** PostgreSQL (Prisma ORM). Tabelas-chave: `User, Team, TeamMember, WabaAccount, PhoneNumber, Contact, Conversation, Message, MessageReceipt, Assignment, Transfer, Template, WebhookEvent, AuditLog`.
- **Cache/Fila:** Redis (rate limit, sessões, filas leves – BullMQ opcional).
- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui, WebSocket client.
- **Edge:** NGINX com TLS e proxy de WebSocket.
- **Infra:** Docker Compose (dev) e Docker/K8s (prod).

## 3. Modelagem (resumo)
- **Conversation**: pertence a `Contact` + `PhoneNumber`, status (`OPEN|PENDING|CLOSED`), `currentAssigneeId`, `lastMessageAt` (index).
- **Message**: `INBOUND|OUTBOUND`, tipos (text, image, audio, video, document, interactive, location…), `status` (`QUEUED|SENT|DELIVERED|READ|FAILED`), `waMessageId`.
- **Transfer**: `fromAgentId → toAgentId|toTeamId`, `note`, `transferredAt`.
- **AuditLog**: `actorId`, `action`, `entity`, `entityId`, `metadata`, `at`.

## 4. Integração com Meta (Cloud API)
- **Webhook**:
  - `GET /webhook/whatsapp`: retorna `hub.challenge` quando `verify_token` confere.
  - `POST /webhook/whatsapp`: valida `X-Hub-Signature-256` (`sha256=hmac_hex`) com `WHATSAPP_APP_SECRET`; persiste `WebhookEvent` e roteia:
    - `value.messages[]` → ingestão INBOUND (cria/atualiza contato, conversa, mensagem).
    - `value.statuses[]` → atualização de recibos (sent/delivered/read/failed).
- **Envio**: `POST /{GRAPH_VERSION}/{phone_number_id}/messages` com bearer `WHATSAPP_TOKEN`.
- **Mídia**: download por `media_id`; URLs expiram — usar worker para baixar e persistir (S3/minio ou disco).

## 5. Segurança e Conformidade (LGPD)
- **Auth**: JWT + refresh (rotação), senhas `argon2`/`bcrypt`.
- **RBAC**: ADMIN/SUPERVISOR/AGENT; policies por rota/ação.
- **Proteção do Webhook**: assinatura HMAC, verify token, validação de schema e limites de payload.
- **Dados sensíveis**: segredos no vault/secret manager; criptografar em repouso quando aplicável.
- **LGPD**: retenção configurável (ex.: 180/365 dias), expurgo programado, anonimização (hash/particionamento de telefone), exportabilidade dos dados por contato.
- **Auditoria**: `AuditLog` por ações críticas (login, transferência, mudança de status, configuração de números).

## 6. Observabilidade
- **Logs estruturados** com correlação (request-id).
- **Métricas** (Prometheus): taxa de erro do webhook, latência p95/p99 de envio, backlog/fila, conexões WebSocket.
- **Tracing** (OpenTelemetry): spans p/ Graph API, DB e fila.
- **Alertas**: erro do webhook >1% 5m, latência p95 >1s 5m, reconexões WS elevadas.

## 7. Endpoints (MVP)
- Auth: `POST /auth/login`, `POST /auth/refresh`, `GET /users/me`.
- Users: CRUD + RBAC.
- Teams: CRUD + membros.
- Numbers: CRUD (phone_number_id, waba) e status (ativar/pausar).
- Contacts: busca/criação; Conversations: listagem (filtros: status, assignee, number), detalhe, `assign`, `transfer`, `close`.
- Messages: `POST /messages/send` (texto); `POST /messages/template` (template aprovado).
- Webhook: `GET/POST /webhook/whatsapp`.
- Dashboard: `GET /dash/overview`, `GET /dash/agents`, `GET /dash/numbers`.

## 8. Fluxos Principais
1) **Inbound**: Meta → Webhook → valida → normaliza → `Contact/Conversation` → `Message(INBOUND)` → socket broadcast → (opcional) worker baixa mídia.
2) **Outbound**: UI → API → `Message(QUEUED)` → Graph API → `SENT` → Webhook → `DELIVERED/READ`.
3) **Transferência**: API grava `Transfer`, atualiza `currentAssigneeId`, registra `Assignment`+`AuditLog`, notifica por socket.
4) **Fechamento**: atualiza `status=CLOSED`, registra métrica e eventual CSAT futuro.

## 9. Dashboard & Métricas (consultas sugeridas)
- **TPR** por agente/time (min dif entre primeira OUTBOUND e primeira INBOUND do ciclo).
- **SLA**: % conversas com TPR < X minutos (configurável).
- **Backlog**: `OPEN` sem assignee por time/number.
- **Volume**: `COUNT(messages)` por `date_trunc('hour', timestamp)` e por número/time.
- **Produtividade**: msgs OUTBOUND por agente + conversas resolvidas/dia.

## 10. Deployment
- **Dev**: `docker compose up -d`; `prisma migrate dev`.
- **Prod**: NGINX (TLS/HTTP2), autoscaling (K8s opcional), backups agendados (Postgres), secrets via environment/secret manager, health checks (readiness/liveness).

## 11. Riscos & Mitigações
- **Rate limit / erro na Graph API** → retry com backoff + circuito.
- **Perda de eventos** → persistir `WebhookEvent`; idempotência por `waMessageId`.
- **URLs expiram** → worker de download imediato; storage durável.
- **Escalonamento de filas** → particionar por número/time; namespaces de socket.
- **Conformidade** → políticas de retenção/anonimização e trilhas de auditoria.

## 12. Backlog Futuro
- Templates & mensagens interativas completas, respostas rápidas.
- SLA por fila, roteamento (round-robin, prioridade, skill-based).
- Webhooks de saída e integrações (CRM/ERP).
- CSAT/NPS e etiquetagem de conversas.
