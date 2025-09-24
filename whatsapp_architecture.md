# Arquitetura WhatsApp Multi-Number Platform

## 🏗️ Estrutura em Camadas

### 1. **Core Application Layer** (Desenvolver Primeiro)
```typescript
// Base independente da API WhatsApp
interface CoreServices {
  authentication: AuthService;
  userManagement: UserService;
  teamManagement: TeamService;
  conversationEngine: ConversationService;
  messageStorage: MessageService;
  dashboard: AnalyticsService;
  realtime: WebSocketService;
}
```

### 2. **WhatsApp Integration Layer** (Adicionar Depois)
```typescript
// Camada que conecta com o broker/Meta
interface WhatsAppServices {
  webhookReceiver: WebhookService;
  messageSender: MessageSenderService;
  mediaHandler: MediaService;
  statusTracker: StatusService;
  numberManager: NumberManagerService;
}
```

## 💰 Gestão de Cobrança - Lógica de Negócio

### **Rastreamento de Sessões:**
```typescript
interface ConversationSession {
  id: string;
  phoneNumberId: string;
  contactPhone: string;
  initiatedBy: 'CUSTOMER' | 'BUSINESS';
  startTime: Date;
  lastActivity: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
  isBillable: boolean; // true se BUSINESS initiated
  costCategory?: 'UTILITY' | 'AUTHENTICATION' | 'MARKETING';
}
```

### **Regras de Cobrança:**
- **Customer Initiated** → `isBillable: false`
- **Business Initiated** → `isBillable: true`
- **24h Window** → Resetar billing apenas se cliente iniciar nova conversa

## 🔧 Implementação por Fases

### **FASE 1: Core System (2-3 semanas)**
- [ ] Autenticação JWT + RBAC
- [ ] CRUD Usuários/Times/Números
- [ ] Interface de Conversas (Mock data)
- [ ] Dashboard básico
- [ ] WebSocket infrastructure
- [ ] Database schema completo

### **FASE 2: WhatsApp Integration (1-2 semanas)**
- [ ] Webhook endpoint (verificação + recebimento)
- [ ] Message sender service
- [ ] Status tracking (sent/delivered/read/failed)
- [ ] Session billing logic
- [ ] Error handling & retry mechanism

### **FASE 3: Advanced Features (Ongoing)**
- [ ] Media download/upload
- [ ] Template management
- [ ] Bulk messaging
- [ ] Advanced analytics
- [ ] Rate limiting & queueing

## 🏢 Vantagens da Abordagem em Fases

### **Para o Negócio:**
- ✅ **Demonstração rápida** para stakeholders
- ✅ **Validação do UX** sem dependências externas
- ✅ **Desenvolvimento paralelo** (frontend + backend)
- ✅ **Testes isolados** de cada camada

### **Para o Desenvolvimento:**
- ✅ **Menor complexidade inicial**
- ✅ **Debug mais fácil**
- ✅ **Flexibilidade** para mudanças de broker
- ✅ **Teste A/B** com diferentes provedores

## 📊 Estrutura de Dados - Multi-Number

```typescript
// Schema para múltiplos números
interface WhatsAppNumber {
  id: string;
  phoneNumberId: string; // Meta's phone number ID
  displayPhoneNumber: string; // +55 11 99999-9999
  businessAccountId: string;
  isActive: boolean;
  
  // Configurações por número
  defaultTeam?: Team;
  businessHours?: BusinessHours;
  autoAssignment: boolean;
  
  // Métricas por número
  totalConversations: number;
  billableConversations: number;
  monthlySpend: number;
}
```

## 🎯 Considerações Estratégicas

### **Multi-Tenant por Número:**
Cada número pode ter configurações independentes:
- Times específicos
- Horários de atendimento
- Regras de roteamento
- Templates personalizados

### **Billing Intelligence:**
- **Real-time cost tracking** por número
- **Alertas de budget** configuráveis
- **Relatórios de ROI** por campanha/número
- **Otimização automática** de custos