# 📝 Padrões de Código - WhatsApp Manager Platform

## 🎯 Visão Geral

Este documento define os padrões de código, convenções e boas práticas para o desenvolvimento da **WhatsApp Manager Platform**.

---

## 🏗️ Arquitetura e Estrutura

### **Princípios Arquiteturais**

#### **1. Clean Architecture**
```
src/
├── 📁 domain/          # Regras de negócio
├── 📁 application/     # Casos de uso
├── 📁 infrastructure/  # Implementações
└── 📁 presentation/    # Controllers/UI
```

#### **2. SOLID Principles**
- **S** - Single Responsibility
- **O** - Open/Closed
- **L** - Liskov Substitution
- **I** - Interface Segregation
- **D** - Dependency Inversion

#### **3. DRY (Don't Repeat Yourself)**
- Evitar duplicação de código
- Criar utilitários reutilizáveis
- Usar composição ao invés de herança

---

## 📁 Estrutura de Arquivos

### **Backend (NestJS)**
```
src/
├── 📁 auth/                 # Autenticação
│   ├── 📁 guards/          # Guards de autenticação
│   ├── 📁 strategies/      # Estratégias JWT
│   ├── 📁 decorators/      # Decorators customizados
│   ├── 📁 dto/            # Data Transfer Objects
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── 📁 users/               # Gestão de usuários
├── 📁 teams/               # Gestão de equipes
├── 📁 conversations/       # Conversas WhatsApp
├── 📁 common/              # Utilitários compartilhados
│   ├── 📁 decorators/
│   ├── 📁 filters/
│   ├── 📁 guards/
│   ├── 📁 interceptors/
│   └── 📁 pipes/
├── 📁 database/            # Configuração do banco
│   ├── 📁 migrations/
│   └── 📁 seeds/
└── main.ts
```

### **Frontend (React)**
```
src/
├── 📁 components/          # Componentes reutilizáveis
│   ├── 📁 ui/             # Componentes base (shadcn/ui)
│   ├── 📁 forms/          # Formulários
│   ├── 📁 layout/         # Layout components
│   └── 📁 features/       # Componentes específicos
├── 📁 pages/              # Páginas da aplicação
├── 📁 hooks/              # Custom hooks
├── 📁 services/           # API services
├── 📁 types/              # TypeScript types
├── 📁 utils/              # Utilitários
├── 📁 contexts/           # React contexts
└── App.tsx
```

---

## 💻 Padrões de Código

### **TypeScript**

#### **Configuração**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### **Nomenclatura**
```typescript
// Interfaces - PascalCase
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Types - PascalCase
type UserRole = 'ADMIN' | 'USER' | 'GUEST';

// Enums - PascalCase
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

// Classes - PascalCase
class UserService {
  // Métodos - camelCase
  async createUser(userData: CreateUserDto): Promise<User> {
    // Implementação
  }
  
  // Propriedades - camelCase
  private readonly userRepository: UserRepository;
}

// Constantes - UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 10;
```

#### **Tipos e Interfaces**
```typescript
// ✅ Bom - Interface para objetos
interface User {
  id: string;
  email: string;
  profile: UserProfile;
}

// ✅ Bom - Type para unions
type Status = 'loading' | 'success' | 'error';

// ✅ Bom - Generic types
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// ❌ Ruim - any
function processData(data: any): any {
  return data;
}

// ✅ Bom - Tipos específicos
function processData(data: UserData): ProcessedUserData {
  return transformUserData(data);
}
```

### **NestJS**

#### **Controllers**
```typescript
// ✅ Bom - Controller limpo
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:read')
  async findAll(@Query() query: FindUsersDto): Promise<PaginatedResponse<User>> {
    return this.usersService.findAll(query);
  }

  @Post()
  @RequirePermissions('users:create')
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }
}
```

#### **Services**
```typescript
// ✅ Bom - Service com responsabilidade única
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Validação
    await this.validateUserData(createUserDto);
    
    // Criação
    const user = await this.usersRepository.create(createUserDto);
    
    // Ações pós-criação
    await this.emailService.sendWelcomeEmail(user.email);
    
    return user;
  }

  private async validateUserData(dto: CreateUserDto): Promise<void> {
    // Lógica de validação
  }
}
```

#### **DTOs**
```typescript
// ✅ Bom - DTO com validação
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsEnum(UserRole)
  role: UserRole;
}
```

### **React**

#### **Componentes**
```typescript
// ✅ Bom - Componente funcional com TypeScript
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete
}) => {
  const handleEdit = useCallback(() => {
    onEdit(user);
  }, [user, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(user.id);
  }, [user.id, onDelete]);

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>{user.firstName} {user.lastName}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="outline">{user.role}</Badge>
      </CardContent>
      <CardFooter>
        <Button onClick={handleEdit}>Edit</Button>
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
```

#### **Hooks**
```typescript
// ✅ Bom - Custom hook
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await usersService.findAll();
      setUsers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
};
```

---

## 🎨 Padrões de UI/UX

### **Design System**

#### **Cores**
```css
/* Tailwind CSS - Cores customizadas */
:root {
  --primary: 220 14.3% 95.9%;
  --primary-foreground: 220.9 39.3% 11%;
  --secondary: 220 14.3% 95.9%;
  --secondary-foreground: 220.9 39.3% 11%;
  --muted: 220 14.3% 95.9%;
  --muted-foreground: 220 8.9% 46.1%;
  --accent: 220 14.3% 95.9%;
  --accent-foreground: 220.9 39.3% 11%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 220 10% 3.9%;
  --background: 0 0% 100%;
  --foreground: 220 10% 3.9%;
}
```

#### **Tipografia**
```css
/* Hierarquia de textos */
.text-display { @apply text-4xl font-bold; }
.text-heading-1 { @apply text-3xl font-semibold; }
.text-heading-2 { @apply text-2xl font-semibold; }
.text-heading-3 { @apply text-xl font-medium; }
.text-body { @apply text-base; }
.text-caption { @apply text-sm text-muted-foreground; }
```

#### **Espaçamento**
```css
/* Sistema de espaçamento */
.spacing-xs { @apply p-1; }
.spacing-sm { @apply p-2; }
.spacing-md { @apply p-4; }
.spacing-lg { @apply p-6; }
.spacing-xl { @apply p-8; }
```

### **Componentes**

#### **Padrão de Componente**
```typescript
// ✅ Bom - Componente bem estruturado
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  };
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8 text-lg'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size]
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};
```

---

## 🧪 Padrões de Testes

### **Backend Tests**

#### **Unit Tests**
```typescript
// ✅ Bom - Teste unitário
describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      };
      const expectedUser: User = {
        id: '1',
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
    });
  });
});
```

#### **Integration Tests**
```typescript
// ✅ Bom - Teste de integração
describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let repository: UsersRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    repository = moduleFixture.get<UsersRepository>(UsersRepository);
    await app.init();
  });

  it('/users (POST)', () => {
    const createUserDto = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe(createUserDto.email);
      });
  });
});
```

### **Frontend Tests**

#### **Component Tests**
```typescript
// ✅ Bom - Teste de componente
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user information correctly', () => {
    render(
      <UserCard
        user={mockUser}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('USER')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <UserCard
        user={mockUser}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

---

## 📝 Documentação

### **JSDoc**
```typescript
// ✅ Bom - Documentação JSDoc
/**
 * Creates a new user in the system
 * @param createUserDto - User data for creation
 * @returns Promise<User> - The created user
 * @throws {BadRequestException} When user data is invalid
 * @throws {ConflictException} When email already exists
 * @example
 * ```typescript
 * const user = await usersService.create({
 *   email: 'john@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   role: UserRole.USER
 * });
 * ```
 */
async create(createUserDto: CreateUserDto): Promise<User> {
  // Implementation
}
```

### **README**
```markdown
# Component Name

Brief description of what this component does.

## Usage

```typescript
import { ComponentName } from './ComponentName';

<ComponentName
  prop1="value1"
  prop2="value2"
  onAction={handleAction}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | boolean | false | Description of prop2 |

## Examples

### Basic Usage
[Example code]

### Advanced Usage
[Example code]
```

---

## 🔧 Ferramentas e Configurações

### **ESLint**
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### **Prettier**
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### **Husky**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## 🚀 Performance

### **Backend Performance**
```typescript
// ✅ Bom - Cache e otimização
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cacheManager: CacheManager,
  ) {}

  async findById(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    
    // Verificar cache
    let user = await this.cacheManager.get<User>(cacheKey);
    if (user) {
      return user;
    }

    // Buscar no banco
    user = await this.usersRepository.findById(id);
    
    // Armazenar no cache
    await this.cacheManager.set(cacheKey, user, 300); // 5 minutos
    
    return user;
  }
}
```

### **Frontend Performance**
```typescript
// ✅ Bom - Lazy loading e memoização
const UserList = React.lazy(() => import('./UserList'));

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  // Memoização de dados
  const memoizedUsers = useMemo(() => {
    return users.filter(user => user.isActive);
  }, [users]);

  // Debounce para busca
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      // Lógica de busca
    }, 300),
    []
  );

  return (
    <Suspense fallback={<Loading />}>
      <UserList users={memoizedUsers} />
    </Suspense>
  );
};
```

---

## 🔒 Segurança

### **Backend Security**
```typescript
// ✅ Bom - Validação e sanitização
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@RequirePermissions('users:create')
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createUserDto: CreateUserDto): Promise<User> {
  // Sanitizar dados
  const sanitizedDto = this.sanitizeUserData(createUserDto);
  
  // Validar permissões
  await this.validateUserPermissions();
  
  return this.usersService.create(sanitizedDto);
}

private sanitizeUserData(dto: CreateUserDto): CreateUserDto {
  return {
    ...dto,
    email: dto.email.toLowerCase().trim(),
    firstName: dto.firstName.trim(),
    lastName: dto.lastName.trim(),
  };
}
```

### **Frontend Security**
```typescript
// ✅ Bom - Sanitização de inputs
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 255); // Limita tamanho
};

// ✅ Bom - Validação de formulários
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
```

---

**Estes padrões devem ser seguidos por todos os desenvolvedores para garantir consistência e qualidade do código.**
