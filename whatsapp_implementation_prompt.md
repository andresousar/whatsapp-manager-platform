# Prompt Completo: Solução WhatsApp Cloud API Multi-Tenant

## Contexto e Objetivo

Você é um desenvolvedor sênior especialista em Node.js e WhatsApp Cloud API. Deve implementar uma solução profissional multi-tenant para gerenciamento de comunicação WhatsApp Business com os seguintes requisitos:

## Stack Tecnológica Definida

```json
{
  "backend": {
    "runtime": "Node.js 20 LTS",
    "framework": "Express.js + TypeScript",
    "orm": "Prisma",
    "database": "PostgreSQL",
    "cache": "Redis",
    "queue": "Bull Queue + Redis",
    "auth": "JWT + bcrypt",
    "validation": "Joi",
    "testing": "Jest + Supertest",
    "monitoring": "Winston (logs)"
  },
  "frontend": {
    "framework": "React.js + TypeScript",
    "state": "Zustand ou Redux Toolkit",
    "ui": "TailwindCSS + Shadcn/ui",
    "realtime": "Socket.io Client",
    "charts": "Recharts"
  },
  "infra": {
    "containerization": "Docker + docker-compose",
    "reverse_proxy": "Nginx",
    "ssl": "Let's Encrypt",
    "process_manager": "PM2"
  }
}
```

## Arquitetura Multi-Tenant

### Estrutura de Isolamento
- **Database per Tenant**: Cada cliente tem schema isolado
- **API Routes**: Prefixo `/api/v1/tenant/:tenantId/`
- **Authentication**: JWT com tenant scope
- **Rate Limiting**: Por tenant e por número WhatsApp

### Models Principais (Prisma Schema)

```prisma
// Tenants e Users
model Tenant {
  id          String   @id @default(cuid())
  name        String
  subdomain   String   @unique
  plan        Plan     @default(STARTER)
  status      Status   @default(ACTIVE)
  settings    Json     @default("{}")
  createdAt   DateTime @default(now())
  
  users       User[]
  phones      WhatsAppPhone[]
  conversations Conversation[]
}

model User {
  id        String @id @default(cuid())
  tenantId  String
  email     String @unique
  role      Role   @default(OPERATOR)
  
  tenant    Tenant @relation(fields: [tenantId], references: [id])
}

// WhatsApp
model WhatsAppPhone {
  id              String @id @default(cuid())
  tenantId        String
  phoneNumberId   String @unique // WhatsApp Phone Number ID
  businessId      String         // WhatsApp Business Account ID
  displayName     String
  verifiedName    String
  status          PhoneStatus @default(ACTIVE)
  webhookUrl      String?
  accessToken     String @db.Text
  
  tenant          Tenant @relation(fields: [tenantId], references: [id])
  conversations   Conversation[]
  messages        Message[]
}

model Conversation {
  id          String @id @default(cuid())
  tenantId    String
  phoneId     String
  contactNumber String
  contactName   String?
  status        ConversationStatus @default(OPEN)
  lastMessage   DateTime?
  
  tenant      Tenant @relation(fields: [tenantId], references: [id])
  phone       WhatsAppPhone @relation(fields: [phoneId], references: [id])
  messages    Message[]
}

model Message {
  id              String @id @default(cuid())
  conversationId  String
  phoneId         String
  waMessageId     String? @unique // WhatsApp Message ID
  type            MessageType
  content         Json
  direction       Direction // INBOUND | OUTBOUND
  status          MessageStatus @default(PENDING)
  timestamp       DateTime @default(now())
  
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  phone          WhatsAppPhone @relation(fields: [phoneId], references: [id])
}

enum Plan { STARTER, PROFESSIONAL, ENTERPRISE }
enum Status { ACTIVE, SUSPENDED, CANCELLED }
enum Role { SUPER_ADMIN, ADMIN, OPERATOR, VIEWER }
enum PhoneStatus { ACTIVE, INACTIVE, SUSPENDED }
enum ConversationStatus { OPEN, CLOSED, ARCHIVED }
enum MessageType { TEXT, IMAGE, AUDIO, VIDEO, DOCUMENT, TEMPLATE }
enum Direction { INBOUND, OUTBOUND }
enum MessageStatus { PENDING, SENT, DELIVERED, READ, FAILED }
```

## WhatsApp Cloud API Integration

### 1. Webhook Handler (Crítico)
```typescript
// Deve responder em <200ms para não perder mensagens
app.post('/webhook/whatsapp/:phoneId', async (req, res) => {
  try {
    // SEMPRE responder 200 primeiro
    res.status(200).send('OK');
    
    const { phoneId } = req.params;
    const webhookData = req.body;
    
    // Validar webhook signature (Meta exige)
    if (!validateWebhookSignature(req)) {
      console.log('Invalid webhook signature');
      return;
    }
    
    // Processar assincronamente com Queue
    await messageQueue.add('processWebhook', {
      phoneId,
      data: webhookData,
      timestamp: Date.now()
    }, {
      priority: 1,
      attempts: 3,
      backoff: 'exponential'
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Não retornar erro - WhatsApp pode parar de enviar
  }
});
```

### 2. Message Sender com Rate Limiting
```typescript
class WhatsAppService {
  private rateLimiter: Map<string, number[]> = new Map();
  
  async sendMessage(phoneId: string, to: string, message: any) {
    // Rate limiting: 1000 msgs/day, 80/min (Cloud API limits)
    if (!this.checkRateLimit(phoneId)) {
      throw new Error('Rate limit exceeded');
    }
    
    const phone = await this.getPhone(phoneId);
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phone.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: message.type,
        [message.type]: message.content
      },
      {
        headers: {
          'Authorization': `Bearer ${phone.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Salvar message com WhatsApp ID para tracking
    await this.saveMessage({
      conversationId: await this.getOrCreateConversation(phoneId, to),
      phoneId,
      waMessageId: response.data.messages[0].id,
      type: message.type,
      content: message,
      direction: 'OUTBOUND',
      status: 'SENT'
    });
    
    return response.data;
  }
}
```

### 3. Template Messages (Essencial para WhatsApp Business)
```typescript
interface WhatsAppTemplate {
  name: string;
  language: string;
  components?: {
    type: 'header' | 'body' | 'footer';
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time';
      text?: string;
      currency?: { fallback_value: string; code: string; amount_1000: number };
      date_time?: { fallback_value: string };
    }>;
  }[];
}

async sendTemplate(phoneId: string, to: string, template: WhatsAppTemplate) {
  return this.sendMessage(phoneId, to, {
    type: 'template',
    template: template
  });
}
```

## Funcionalidades Core Obrigatórias

### 1. Sistema de Autenticação Multi-Tenant
```typescript
// Middleware de tenant validation
const validateTenant = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.params.tenantId || req.headers['x-tenant-id'];
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' });
  }
  
  const tenant = await prisma.tenant.findUnique({ 
    where: { id: tenantId, status: 'ACTIVE' } 
  });
  
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  req.tenant = tenant;
  next();
};

// JWT com tenant scope
const generateToken = (user: User) => {
  return jwt.sign(
    { 
      userId: user.id, 
      tenantId: user.tenantId,
      role: user.role 
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};
```

### 2. Queue System para Mensagens
```typescript
// Message Queue Worker
messageQueue.process('processWebhook', async (job) => {
  const { phoneId, data } = job.data;
  
  const changes = data.entry?.[0]?.changes?.[0];
  if (changes?.field === 'messages') {
    const messages = changes.value?.messages || [];
    
    for (const message of messages) {
      await this.processInboundMessage(phoneId, message);
    }
    
    // Process message status updates
    const statuses = changes.value?.statuses || [];
    for (const status of statuses) {
      await this.updateMessageStatus(status);
    }
  }
});

// Outbound message queue
messageQueue.process('sendMessage', async (job) => {
  const { phoneId, to, message } = job.data;
  
  try {
    await whatsAppService.sendMessage(phoneId, to, message);
  } catch (error) {
    // Retry logic baseado no erro
    if (error.response?.status === 429) {
      throw new Error('Rate limited - will retry');
    }
    // Log error but don't retry for invalid numbers, etc.
  }
});
```

### 3. Real-time Dashboard com Socket.io
```typescript
// Socket.io integration
io.use(socketAuth); // Validate JWT

io.on('connection', (socket) => {
  socket.on('joinTenant', (tenantId) => {
    socket.join(`tenant:${tenantId}`);
  });
  
  socket.on('joinConversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });
});

// Emit real-time updates
const emitNewMessage = (message: Message) => {
  io.to(`tenant:${message.tenantId}`).emit('newMessage', message);
  io.to(`conversation:${message.conversationId}`).emit('messageUpdate', message);
};
```

## API Routes Structure

```
/api/v1/
├── /auth/
│   ├── POST /login
│   ├── POST /refresh
│   └── POST /logout
├── /tenant/:tenantId/
│   ├── /dashboard/
│   │   └── GET /stats
│   ├── /phones/
│   │   ├── GET / (list all phones)
│   │   ├── POST / (add phone)
│   │   ├── PUT /:phoneId (update)
│   │   └── DELETE /:phoneId
│   ├── /conversations/
│   │   ├── GET / (list with pagination)
│   │   ├── GET /:conversationId/messages
│   │   └── PUT /:conversationId/status
│   ├── /messages/
│   │   ├── POST /send (send message)
│   │   ├── POST /template (send template)
│   │   └── POST /bulk (bulk send)
│   └── /analytics/
│       ├── GET /messages-count
│       ├── GET /conversations-stats
│       └── GET /performance
└── /webhook/
    └── POST /whatsapp/:phoneId
```

## Frontend Dashboard Requirements

### 1. Multi-tenant Interface
- Tenant switcher para super admins
- Branded interface per tenant
- Role-based component visibility

### 2. Real-time Chat Interface
```tsx
const ChatInterface = ({ conversationId }: { conversationId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket] = useSocket();
  
  useEffect(() => {
    socket.on('messageUpdate', (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });
    
    return () => socket.off('messageUpdate');
  }, [conversationId]);
  
  // WhatsApp-like interface with message status indicators
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
};
```

### 3. Analytics Dashboard
- Messages sent/received charts
- Response time metrics  
- Conversation volume
- Revenue tracking per tenant

## Security & Compliance Obrigatórios

### 1. WhatsApp Webhook Validation
```typescript
const validateWebhookSignature = (req: Request): boolean => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const payload = JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
    
  return signature === `sha256=${expectedSignature}`;
};
```

### 2. Data Protection
- Encrypt sensitive data (access tokens)
- GDPR compliance for EU users
- Message retention policies
- Audit logging for all actions

### 3. Rate Limiting Multi-level
```typescript
// Global rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Per-tenant rate limiting
const tenantRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Implement based on tenant plan
  const limits = {
    STARTER: 1000,
    PROFESSIONAL: 5000,
    ENTERPRISE: 50000
  };
  // Check usage against limits
};
```

## Deployment & Monitoring

### 1. Docker Configuration
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Health Checks
```typescript
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    whatsappApi: await checkWhatsAppAPI()
  };
  
  const healthy = Object.values(checks).every(check => check);
  res.status(healthy ? 200 : 503).json(checks);
});
```

## Próximos Passos de Implementação

### Ordem de Desenvolvimento:
1. **Setup inicial**: Database, Auth, Multi-tenant structure
2. **WhatsApp Integration**: Webhook + Send API
3. **Queue System**: Bull + Redis setup
4. **Basic Dashboard**: React interface
5. **Real-time**: Socket.io integration
6. **Advanced Features**: Templates, Analytics
7. **Testing**: Unit + Integration tests
8. **Deploy**: Docker + Production setup

### Informações Críticas WhatsApp:
- **Webhook response**: <5s ou WhatsApp para de enviar
- **Rate limits**: 1000 msgs/day inicialmente, depois baseado em qualidade
- **Templates**: Devem ser aprovados pelo Meta antes do uso
- **Business verification**: Necessário para produção

Quer que detalhe alguma seção específica ou comece com a implementação de algum módulo?