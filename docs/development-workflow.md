# 🔄 Workflow de Desenvolvimento - WhatsApp Manager Platform

## 🎯 Visão Geral

Este documento define o workflow detalhado para desenvolvimento da **WhatsApp Manager Platform**, incluindo processos, ferramentas e boas práticas.

---

## 🚀 Início do Desenvolvimento

### **1. Setup Inicial do Ambiente**

#### **Pré-requisitos**
```bash
# Verificar versões
node --version    # >= 18.0.0
npm --version     # >= 8.0.0
git --version     # >= 2.30.0
```

#### **Clone e Setup**
```bash
# 1. Clone do repositório
git clone https://github.com/andresousar/whatsapp-manager-platform.git
cd whatsapp-manager-platform

# 2. Executar setup automático
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Verificar instalação
npm run dev
```

### **2. Configuração do Ambiente de Desenvolvimento**

#### **Backend (NestJS)**
```bash
cd apps/api

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
npx prisma generate
npx prisma db push
npx prisma db seed

# Iniciar desenvolvimento
npm run start:dev
```

#### **Frontend (React)**
```bash
cd apps/web

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Iniciar desenvolvimento
npm run dev
```

---

## 🔄 Fluxo de Desenvolvimento Diário

### **1. Início do Dia**

#### **Checklist Matinal**
- [ ] Pull das últimas mudanças
- [ ] Verificar status do CI/CD
- [ ] Revisar issues e PRs pendentes
- [ ] Verificar status do sistema

```bash
# Comandos diários
git pull origin develop
npm run test
npm run lint
```

### **2. Desenvolvimento de Feature**

#### **Processo Completo**
```bash
# 1. Criar branch
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature

# 2. Desenvolver
# Implementar funcionalidade
# Escrever testes
# Atualizar documentação

# 3. Testar localmente
npm run test
npm run lint
npm run build

# 4. Commit
git add .
git commit -m "feat(scope): descrição da feature"

# 5. Push
git push origin feature/nome-da-feature

# 6. Criar Pull Request
# Acessar GitHub e criar PR
```

### **3. Code Review Process**

#### **Como Revisar**
1. **Verificar funcionalidade**
   - Código faz o que deveria?
   - Testes cobrem os casos?

2. **Verificar qualidade**
   - Código limpo e legível?
   - Segue padrões do projeto?
   - Performance adequada?

3. **Verificar segurança**
   - Sem vulnerabilidades?
   - Dados sensíveis protegidos?

#### **Como Ser Revisado**
1. **Preparar PR**
   - Descrição clara
   - Screenshots se necessário
   - Checklist preenchido

2. **Responder feedback**
   - Aceitar sugestões
   - Explicar decisões
   - Fazer ajustes

### **4. Deploy e Release**

#### **Deploy Automático**
```bash
# Push para main = Deploy automático
git checkout main
git merge develop
git push origin main

# GitHub Actions executa:
# 1. Testes
# 2. Build
# 3. Deploy
# 4. Backup
```

#### **Release Manual**
```bash
# 1. Criar branch release
git checkout -b release/v1.0.0

# 2. Atualizar version
npm version patch

# 3. Merge para main
git checkout main
git merge release/v1.0.0
git tag v1.0.0
git push origin main --tags

# 4. Merge para develop
git checkout develop
git merge main
git push origin develop
```

---

## 🛠️ Ferramentas de Desenvolvimento

### **1. Editor e IDE**

#### **VS Code (Recomendado)**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

#### **Extensões Essenciais**
- **ESLint** - Linting
- **Prettier** - Formatação
- **TypeScript** - Suporte TS
- **Prisma** - Suporte Prisma
- **Tailwind CSS** - Suporte Tailwind

### **2. Git e Versionamento**

#### **Configuração Git**
```bash
# Configuração global
git config --global user.name "Andre Sertel"
git config --global user.email "andresertel@gmail.com"

# Configuração local
git config user.name "Andre Sertel"
git config user.email "andresertel@gmail.com"
```

#### **Aliases Úteis**
```bash
# Adicionar aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
```

### **3. Debugging e Testing**

#### **Debugging Backend**
```bash
# Debug com VS Code
# 1. Configurar launch.json
# 2. Colocar breakpoints
# 3. Iniciar debug

# Debug com logs
console.log('Debug info:', data);
```

#### **Debugging Frontend**
```bash
# React DevTools
# 1. Instalar extensão
# 2. Abrir DevTools
# 3. Usar React tab

# Console debugging
console.log('Debug info:', data);
```

### **4. Performance e Monitoramento**

#### **Performance Backend**
```bash
# Profiling
npm run start:dev -- --inspect

# Memory usage
node --inspect-brk dist/main.js
```

#### **Performance Frontend**
```bash
# Bundle analysis
npm run build
npm run analyze

# Lighthouse
npm run lighthouse
```

---

## 📋 Checklist de Qualidade

### **Antes de Commit**
- [ ] Código testado localmente
- [ ] Testes passando
- [ ] Linting sem erros
- [ ] TypeScript sem erros
- [ ] Documentação atualizada

### **Antes de Push**
- [ ] Commits com mensagens claras
- [ ] Branch atualizada
- [ ] Conflitos resolvidos
- [ ] Backup local feito

### **Antes de PR**
- [ ] Feature completa
- [ ] Testes escritos
- [ ] Documentação atualizada
- [ ] Screenshots se necessário
- [ ] Checklist preenchido

### **Antes de Merge**
- [ ] Code review aprovado
- [ ] CI/CD passando
- [ ] Conflitos resolvidos
- [ ] Deploy testado

---

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **Backend não inicia**
```bash
# Verificar dependências
npm install

# Verificar banco
npx prisma generate
npx prisma db push

# Verificar logs
npm run start:dev
```

#### **Frontend não compila**
```bash
# Limpar cache
npm run clean
rm -rf node_modules
npm install

# Verificar TypeScript
npm run type-check
```

#### **Testes falhando**
```bash
# Verificar configuração
npm run test -- --verbose

# Limpar cache de testes
npm run test -- --clearCache
```

#### **Git issues**
```bash
# Reset local
git reset --hard HEAD

# Limpar branch
git clean -fd

# Rebase
git rebase -i HEAD~3
```

### **Problemas de Deploy**

#### **Build falhando**
```bash
# Verificar logs
gh run view --log

# Verificar dependências
npm ci

# Verificar environment
echo $NODE_ENV
```

#### **Deploy falhando**
```bash
# Verificar secrets
gh secret list

# Verificar permissions
gh auth status

# Rollback
git revert HEAD
git push origin main
```

---

## 📊 Métricas e KPIs

### **Métricas de Desenvolvimento**
- **Velocity** - Story points por sprint
- **Lead Time** - Tempo de idea to production
- **Cycle Time** - Tempo de commit to production
- **Deploy Frequency** - Frequência de deploys

### **Métricas de Qualidade**
- **Bug Rate** - Bugs por feature
- **Test Coverage** - Cobertura de testes
- **Code Quality** - Score de qualidade
- **Technical Debt** - Dívida técnica

### **Métricas de Performance**
- **Response Time** - Tempo de resposta
- **Throughput** - Requisições por segundo
- **Error Rate** - Taxa de erros
- **Uptime** - Tempo de funcionamento

---

## 🎯 Próximos Passos

### **Desenvolvimento Imediato**
1. **Setup do Backend** - NestJS + Prisma
2. **Setup do Frontend** - React + Vite
3. **Sistema RBAC** - Autenticação e autorização
4. **Integração WhatsApp** - API integration

### **Melhorias Futuras**
1. **CI/CD Pipeline** - Otimização
2. **Monitoring** - Observabilidade
3. **Performance** - Otimização
4. **Security** - Hardening

---

**Este workflow deve ser seguido por todos os desenvolvedores para garantir consistência e qualidade.**
