# WhatsApp Manager Platform - Documentação Completa

## 📋 Índice
1. [Visão Geral do Projeto](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura)
3. [Sistema RBAC Detalhado](#rbac-sistema)
4. [Stack Tecnológica](#stack)
5. [Estrutura do Projeto](#estrutura)
6. [Configuração do Ambiente](#ambiente)
7. [Guia de Implementação](#implementação)
8. [Templates Recomendados](#templates)

---

## 🎯 Visão Geral do Projeto {#visão-geral}

### **Objetivo Principal**
Criar uma plataforma profissional para gerenciamento centralizado de múltiplos números WhatsApp Business, com controle de acesso granular, gestão de equipes e monitoramento de custos.

### **Características Principais**
- 🔐 **Sistema RBAC completo** com 5 níveis hierárquicos
- 📱 **Multi-número WhatsApp** (N instâncias simultâneas)
- 💰 **Controle de billing** (quem paga por cada conversa)
- 🎯 **Gestão de equipes** e distribuição automática
- 📊 **Dashboard em tempo real** com métricas avançadas
- 🔄 **WebSocket** para atualizações instantâneas

### **Público-Alvo**
- **Call Centers** e empresas de atendimento
- **E-commerce** com múltiplas marcas/lojas
- **Agências digitais** gerenciando clientes
- **Empresas B2B** com segmentação por equipes

---

## 🏗️ Arquitetura do Sistema {#arquitetura}

```mermaid
graph TB
    subgraph "Frontend (React)"
        A[Dashboard] --> B[Inbox]
        B --> C[Chat Interface]
        A --> D[Admin Panel]
        D --> E[User Management]
        D --> F[Team Management]
    end
    
    subgraph "Backend (NestJS)"
        G[API Gateway] --> H[Auth Module]
        G --> I[Users Module]
        G --> J[Teams Module]
        G --> K[WhatsApp Module]
        K --> L[Webhook Handler]
        K --> M[Message Sender]
    end
    
    subgraph "Database"
        N[(PostgreSQL)]
        O[(Redis)]
    end
    
    subgraph "External APIs"
        P[WhatsApp Business API]
        Q[Broker API]
    end
    
    A -.->|WebSocket| G
    G --> N
    G --> O
    L <--> P
    M <--> Q
```

### **Camadas da Aplicação**
1. **Presentation Layer** - React + shadcn/ui
2. **API Layer** - NestJS + Express
3. **Business Logic** - Services + DTOs
4. **Data Access** - Prisma ORM
5. **Database** - PostgreSQL + Redis
6. **Integration** - WhatsApp Cloud API

---

## 🔐 Sistema RBAC Detalhado {#rbac-sistema}

### **Hierarquia de Acesso**
```
SUPER_ADMIN (Nível 1) - Acesso total ao sistema
    ├── ADMIN (Nível 2) - Gestão de conta
    │   ├── SUPERVISOR (Nível 3) - Gestão de equipe
    │   │   ├── AGENT (Nível 4) - Atendimento
    │   │   └── ANALYST (Nível 4) - Relatórios
```

### **Matriz de Permissões**

| Recurso | SUPER_ADMIN | ADMIN | SUPERVISOR | AGENT | ANALYST |
|---------|:-----------:|:-----:|:----------:|:-----:|:-------:|
| **Usuários** |
| Criar usuários | ✅ | ✅ (exceto SUPER) | ❌ | ❌ | ❌ |
| Editar usuários | ✅ | ✅ (exceto SUPER) | ✅ (própria equipe) | ✅ (próprio perfil) | ✅ (próprio perfil) |
| Deletar usuários | ✅ | ✅ (exceto SUPER) | ❌ | ❌ | ❌ |
| Ver usuários | ✅ | ✅ | ✅ (própria equipe) | ✅ (próprio perfil) | ✅ (próprio perfil) |
| **Equipes** |
| Criar equipes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gerenciar equipes | ✅ | ✅ | ✅ (própria equipe) | ❌ | ❌ |
| Ver equipes | ✅ | ✅ | ✅ (própria equipe) | ✅ (própria equipe) | ✅ (própria equipe) |
| **Números WhatsApp** |
| Configurar números | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver números | ✅ | ✅ | ✅ (da equipe) | ✅ (da equipe) | ✅ (da equipe) |
| **Conversas** |
| Ver todas conversas | ✅ | ✅ | ✅ (da equipe) | ✅ (atribuídas) | ✅ (da equipe - só leitura) |
| Atribuir conversas | ✅ | ✅ | ✅ (na equipe) | ❌ | ❌ |
| Responder mensagens | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Relatórios** |
| Relatórios globais | ✅ | ✅ | ❌ | ❌ | ❌ |
| Relatórios da equipe | ✅ | ✅ | ✅ | ❌ | ✅ |
| Relatórios pessoais | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Billing** |
| Ver custos | ✅ | ✅ (limitado) | ❌ | ❌ | ❌ |
| Gerenciar billing | ✅ | ❌ | ❌ | ❌ | ❌ |

### **Permissões Específicas por Módulo**

#### **Auth & Users**
```typescript
enum UserPermissions {
  // CRUD básico
  CREATE_USER = 'users:create',
  READ_USER = 'users:read',
  UPDATE_USER = 'users:update',
  DELETE_USER = 'users:delete',
  
  // Contextuais
  READ_ALL_USERS = 'users:read_all',
  READ_TEAM_USERS = 'users:read_team',
  READ_SELF = 'users:read_self',
  
  // Roles
  MANAGE_USER_ROLES = 'users:manage_roles',
  ASSIGN_TEAM = 'users:assign_team'
}
```

#### **Teams**
```typescript
enum TeamPermissions {
  CREATE_TEAM = 'teams:create',
  READ_TEAM = 'teams:read',
  UPDATE_TEAM = 'teams:update',
  DELETE_TEAM = 'teams:delete',
  
  // Contextuais
  READ_ALL_TEAMS = 'teams:read_all',
  READ_OWN_TEAM = 'teams:read_own',
  
  // Membros
  MANAGE_TEAM_MEMBERS = 'teams:manage_members',
  MANAGE_OWN_TEAM_MEMBERS = 'teams:manage_members_own'
}
```

#### **WhatsApp Numbers**
```typescript
enum NumberPermissions {
  CREATE_NUMBER = 'numbers:create',
  READ_NUMBER = 'numbers:read',
  UPDATE_NUMBER = 'numbers:update',
  DELETE_NUMBER = 'numbers:delete',
  CONFIGURE_NUMBER = 'numbers:configure',
  
  // Contextuais
  READ_ALL_NUMBERS = 'numbers:read_all',
  READ_TEAM_NUMBERS = 'numbers:read_team'
}
```

#### **Conversations**
```typescript
enum ConversationPermissions {
  READ_CONVERSATION = 'conversations:read',
  UPDATE_CONVERSATION = 'conversations:update',
  ASSIGN_CONVERSATION = 'conversations:assign',
  TRANSFER_CONVERSATION = 'conversations:transfer',
  REPLY_MESSAGE = 'conversations:reply',
  
  // Contextuais
  READ_ALL_CONVERSATIONS = 'conversations:read_all',
  READ_TEAM_CONVERSATIONS = 'conversations:read_team',
  READ_ASSIGNED_CONVERSATIONS = 'conversations:read_assigned',
  
  // Ações
  ASSIGN_ANY_CONVERSATION = 'conversations:assign_any',
  ASSIGN_TEAM_CONVERSATION = 'conversations:assign_team'
}
```

#### **Reports**
```typescript
enum ReportPermissions {
  VIEW_REPORTS = 'reports:view',
  EXPORT_REPORTS = 'reports:export',
  CREATE_DASHBOARD = 'reports:create_dashboard',
  
  // Contextuais
  VIEW_ALL_REPORTS = 'reports:view_all',
  VIEW_TEAM_REPORTS = 'reports:view_team',
  VIEW_SELF_REPORTS = 'reports:view_self',
  
  // Avançados
  VIEW_ADVANCED_ANALYTICS = 'reports:view_advanced',
  EXPORT_RAW_DATA = 'reports:export_raw'
}
```

### **Implementação do Sistema de Contexto**

#### **Context Filter Service**
```typescript
@Injectable()
export class ContextFilterService {
  buildFilter(user: User, resource: string): any {
    const roleName = user.role.name;
    
    switch (resource) {
      case 'conversations':
        return this.getConversationFilter(user, roleName);
      case 'users':
        return this.getUserFilter(user, roleName);
      case 'teams':
        return this.getTeamFilter(user, roleName);
      default:
        return {};
    }
  }
  
  private getConversationFilter(user: User, role: string) {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return {}; // Vê todas
        
      case 'SUPERVISOR':
        return { 
          OR: [
            { assignedTo: { teamId: user.teamId } },
            { assignedTo: null, number: { teamId: user.teamId } }
          ]
        };
        
      case 'AGENT':
        return { assignedToId: user.id };
        
      case 'ANALYST':
        return { 
          assignedTo: { teamId: user.teamId },
          // Apenas leitura - implementado no service
        };
        
      default:
        return { id: 'never-match' };
    }
  }
}
```

---

## 🛠️ Stack Tecnológica {#stack}

### **Backend**
- **Framework:** NestJS 10.x (Node.js + TypeScript)
- **Database:** PostgreSQL 16.x
- **ORM:** Prisma 5.x
- **Cache:** Redis 7.x
- **Authentication:** JWT (jsonwebtoken + passport-jwt)
- **WebSocket:** Socket.io
- **Validation:** Class-validator + Class-transformer
- **Documentation:** Swagger/OpenAPI

### **Frontend**
- **Framework:** React 18.x + Vite 5.x
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.x
- **Components:** shadcn/ui
- **State:** Zustand + React Query
- **WebSocket:** Socket.io-client
- **Forms:** React Hook Form + Zod
- **Routing:** React Router 6.x

### **Infrastructure**
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** NGINX
- **Process Manager:** PM2 (produção)
- **Environment:** dotenv
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged

### **External APIs**
- **WhatsApp:** Meta Graph API (Cloud API)
- **Storage:** AWS S3 (para mídia)
- **Monitoring:** Sentry (opcional)

---

## 📁 Estrutura do Projeto {#estrutura}

```
whatsapp-manager/
├── 📁 apps/
│   ├── 📁 api/                          # Backend NestJS
│   │   ├── 📁 src/
│   │   │   ├── 📁 auth/                 # Autenticação & RBAC
│   │   │   │   ├── guards/
│   │   │   │   ├── strategies/
│   │   │   │   ├── decorators/
│   │   │   │   └── dto/
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
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── 📁 test/
│   │
│   └── 📁 web/                          # Frontend React
│       ├── 📁 src/
│       │   ├── 📁 components/           # Componentes reutilizáveis
│       │   │   ├── ui/                  # shadcn/ui components
│       │   │   ├── forms/               # Formulários
│       │   │   └── layout/              # Layout components
│       │   ├── 📁 pages/                # Páginas da aplicação
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── inbox/
│       │   │   ├── admin/
│       │   │   └── settings/
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
├── 📁 docker/                           # Docker configs
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── docker-compose.yml
│
├── 📁 docs/                             # Documentação
│   ├── api.md
│   ├── deployment.md
│   └── user-guide.md
│
└── 📁 scripts/                          # Scripts utilitários
    ├── setup.sh
    ├── seed.js
    └── backup.sh
```

---

## ⚙️ Configuração do Ambiente {#ambiente}

### **Variáveis de Ambiente**

#### **Backend (.env)**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_manager"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_ACCESS_EXPIRE="15m"
JWT_REFRESH_EXPIRE="7d"

# WhatsApp
WHATSAPP_TOKEN="your-whatsapp-access-token"
WHATSAPP_APP_SECRET="your-app-secret-for-webhook-verification"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
GRAPH_API_VERSION="v18.0"

# Application
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"

# File Storage (opcional)
AWS_REGION="us-east-1"
AWS_BUCKET="whatsapp-media-bucket"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# Monitoring (opcional)
SENTRY_DSN="your-sentry-dsn"
```

#### **Frontend (.env)**
```env
VITE_API_URL="http://localhost:3001/api"
VITE_WS_URL="http://localhost:3001"
VITE_APP_NAME="WhatsApp Manager"
VITE_APP_VERSION="1.0.0"
```

### **Docker Compose**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: whatsapp_user
      POSTGRES_PASSWORD: whatsapp_pass
      POSTGRES_DB: whatsapp_manager
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    environment:
      - DATABASE_URL=postgresql://whatsapp_user:whatsapp_pass@postgres:5432/whatsapp_manager
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - "3001:3001"
      
  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    environment:
      - VITE_API_URL=http://api:3001/api
    depends_on:
      - api
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

---

## 🚀 Guia de Implementação {#implementação}

### **Fase 1: Setup Inicial (Semana 1)**
1. ✅ Escolher e configurar template
2. ✅ Configurar Docker + Database
3. ✅ Setup inicial do projeto
4. ✅ Configurar linting e formatação

### **Fase 2: Sistema de Autenticação (Semana 2)**
1. ✅ Schema do banco (users, roles, permissions)
2. ✅ JWT authentication service
3. ✅ RBAC guards e decorators
4. ✅ Login/logout endpoints
5. ✅ Context provider no frontend

### **Fase 3: Gestão de Usuários (Semana 3)**
1. ✅ CRUD de usuários
2. ✅ Gestão de equipes
3. ✅ Interface de administração
4. ✅ Filtros de contexto

### **Fase 4: Base WhatsApp (Semana 4)**
1. ✅ Schema para conversas/mensagens
2. ✅ Interface de chat (mock data)
3. ✅ WebSocket básico
4. ✅ Dashboard inicial

### **Fase 5: Integração WhatsApp (Semana 5-6)**
1. ✅ Webhook receiver
2. ✅ Message sender service
3. ✅ Integração real com Meta API
4. ✅ Testes end-to-end

---

## 📋 Templates Recomendados {#templates}

Vou apresentar as 3 melhores opções na próxima seção...