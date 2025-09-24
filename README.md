# WhatsApp Manager Platform 🚀

Uma plataforma profissional para gerenciamento centralizado de múltiplos números WhatsApp Business, com controle de acesso granular, gestão de equipes e monitoramento de custos.

## 🎯 Características Principais

- 🔐 **Sistema RBAC completo** com 5 níveis hierárquicos
- 📱 **Multi-número WhatsApp** (N instâncias simultâneas)
- 💰 **Controle de billing** inteligente
- 🎯 **Gestão de equipes** e distribuição automática
- 📊 **Dashboard em tempo real** com métricas avançadas
- 🔄 **WebSocket** para atualizações instantâneas

## 🏗️ Arquitetura

### Stack Tecnológica

**Backend:**
- NestJS 10.x + TypeScript
- PostgreSQL 16.x + Prisma ORM
- Redis 7.x (cache)
- JWT Authentication
- Socket.io (WebSocket)

**Frontend:**
- React 18.x + Vite 5.x
- TypeScript 5.x
- Tailwind CSS 3.x
- shadcn/ui components
- Zustand + React Query

**Infraestrutura:**
- GitHub Actions (CI/CD)
- Automated Backups
- Docker (opcional)

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- PostgreSQL 16+
- Redis 7+ (opcional)

### Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/whatsapp-manager-platform.git
cd whatsapp-manager-platform
```

2. **Execute o script de setup:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. **Configure as variáveis de ambiente:**
```bash
# Backend
cd apps/api
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Frontend
cd ../web
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Execute as migrações do banco:**
```bash
cd apps/api
npx prisma db push
npx prisma db seed
```

5. **Inicie os servidores de desenvolvimento:**
```bash
# Backend (Terminal 1)
cd apps/api
npm run start:dev

# Frontend (Terminal 2)
cd apps/web
npm run dev
```

6. **Acesse a aplicação:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api

## 🔐 Sistema RBAC

### Hierarquia de Acesso

```
SUPER_ADMIN (Nível 1) - Acesso total ao sistema
    ├── ADMIN (Nível 2) - Gestão de conta
    │   ├── SUPERVISOR (Nível 3) - Gestão de equipe
    │   │   ├── AGENT (Nível 4) - Atendimento
    │   │   └── ANALYST (Nível 4) - Relatórios
```

### Usuários Padrão

Após executar o seed, você terá acesso aos seguintes usuários:

- **admin@whatsapp-manager.com** (SUPER_ADMIN) - Senha: `Admin123!`
- **supervisor@whatsapp-manager.com** (SUPERVISOR) - Senha: `Supervisor123!`
- **agent@whatsapp-manager.com** (AGENT) - Senha: `Agent123!`

## 📁 Estrutura do Projeto

```
whatsapp-manager/
├── 📁 apps/
│   ├── 📁 api/                          # Backend NestJS
│   │   ├── 📁 src/
│   │   │   ├── 📁 auth/                 # Autenticação & RBAC
│   │   │   ├── 📁 users/                # Gestão de usuários
│   │   │   ├── 📁 teams/                # Gestão de equipes
│   │   │   ├── 📁 numbers/              # Números WhatsApp
│   │   │   ├── 📁 conversations/        # Conversas
│   │   │   ├── 📁 messages/             # Mensagens
│   │   │   ├── 📁 whatsapp/            # Integração WhatsApp
│   │   │   ├── 📁 webhook/              # Webhook handler
│   │   │   ├── 📁 reports/              # Relatórios
│   │   │   ├── 📁 websocket/            # WebSocket gateway
│   │   │   └── 📁 common/               # Shared utilities
│   │   ├── 📁 prisma/
│   │   └── 📁 test/
│   │
│   └── 📁 web/                          # Frontend React
│       ├── 📁 src/
│       │   ├── 📁 components/           # Componentes reutilizáveis
│       │   ├── 📁 pages/                # Páginas da aplicação
│       │   ├── 📁 hooks/                # Custom hooks
│       │   ├── 📁 contexts/             # React contexts
│       │   ├── 📁 services/             # API services
│       │   ├── 📁 types/                # TypeScript types
│       │   └── 📁 utils/                # Utilities
│       └── 📁 public/
│
├── 📁 packages/                         # Shared packages
│   ├── 📁 shared-types/                 # Tipos compartilhados
│   └── 📁 eslint-config/                # Config ESLint
│
├── 📁 docs/                             # Documentação
├── 📁 scripts/                          # Scripts utilitários
└── 📁 .github/                          # GitHub Actions
```

## 🔄 Sistema de Backup

### Backup Automatizado

O sistema inclui um sistema robusto de backup:

- **Backup Diário:** Executado automaticamente via GitHub Actions
- **Backup Manual:** Disponível via `npm run backup`
- **Armazenamento:** S3 (configurável) + GitHub Artifacts
- **Retenção:** 30 dias (configurável)

### Executar Backup Manual

```bash
# Backup do banco de dados
cd scripts
node backup.js

# Backup completo (via GitHub Actions)
gh workflow run backup.yml
```

## 🧪 Testes

```bash
# Backend
cd apps/api
npm run test
npm run test:e2e

# Frontend
cd apps/web
npm run test
npm run test:e2e
```

## 🚀 Deploy

### Produção

```bash
# Build
npm run build

# Deploy
npm run deploy
```

### Docker

```bash
# Desenvolvimento
docker-compose up -d

# Produção
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoramento

- **Logs:** Estruturados com Winston
- **Métricas:** Prometheus + Grafana
- **Alertas:** Slack/Email notifications
- **Health Checks:** `/health` endpoint

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Documentação:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/seu-usuario/whatsapp-manager-platform/issues)
- **Email:** support@whatsapp-manager-platform.com

## 🎯 Roadmap

- [ ] Integração WhatsApp Cloud API
- [ ] Dashboard Analytics Avançado
- [ ] Mobile App (React Native)
- [ ] Integração com CRM
- [ ] AI Chatbot Integration
- [ ] Multi-idioma (i18n)

---

**Desenvolvido com ❤️ para profissionais que precisam de uma solução robusta de gerenciamento WhatsApp.**
