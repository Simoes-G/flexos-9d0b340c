## Objetivo
Transformar o Nexus em um SaaS self-service com uma **homepage pública de vendas** e um fluxo de **cadastro → escolha de plano → workspace isolado por tenant**. O app atual continua igual, mas passa a operar sob `/t/{slug}/...` e cada tenant tem seus próprios dados via `tenant_id` + RLS.

## Plano único disponível (MVP)
- **Nexus Base** — R$ 79/mês, inclui 3 administradores.
- **Usuário extra** — +R$ 30/mês por administrador adicional.
- Sem cobrança real neste ciclo — apenas o fluxo de assinatura/registro.

## Arquitetura de tenancy
- **Multi-tenant lógico**: 1 banco, coluna `tenant_id` em toda tabela de dados + RLS.
- **Roteamento**: slug na URL — `/t/{slug}/dashboard`, `/t/{slug}/estoque`, etc. Subdomínio real fica para depois.
- **Homepage/conta**: rotas públicas fora do tenant (`/`, `/pricing`, `/signup`, `/account`).

## Etapas

### 1. Banco de dados (migration)
Novas tabelas:
- `tenants` — nome, slug (único), plano, seats contratados, status, owner_id.
- `tenant_members` — vínculo user↔tenant com papel (`owner` | `admin` | `member`).
- `plans` — catálogo dos planos (seed com "Nexus Base").
- `subscriptions` — plano ativo do tenant, seats, status, período.

Alterações:
- Adicionar `tenant_id uuid not null` em: `company`, `teams`, `team_members`, `permissions`, `products`, `product_categories`, `stock_movements`, `events`, `event_participants`, `files`, `notifications`, `audit_log`, `integrations`, `service_catalog`, `service_clients`, `service_orders`, `service_order_items`.
- Reescrever policies RLS: além de `auth.uid()`, exigir `tenant_id = current_tenant()` via helper `SECURITY DEFINER` que lê do JWT/claim ou de `tenant_members`.
- Função `has_role` passa a receber `tenant_id`; `user_roles` ganha `tenant_id` (papel é por tenant).
- Contagem de admins do tenant não pode exceder `seats` da subscription (trigger simples).

Dados demo continuam existindo em um tenant "demo" pré-criado.

### 2. Homepage pública (marketing)
Novas rotas públicas em `src/routes/`:
- `index.tsx` — landing de vendas (hero, propostas de valor, módulos, prints, CTA de cadastro).
- `pricing.tsx` — card do plano Base + calculadora de usuários extras (79 + 30×N).
- `signup.tsx` — cria conta, escolhe slug do workspace, seleciona quantidade de admins, cria tenant + subscription, redireciona para `/t/{slug}/dashboard`.
- `login.tsx` — substitui/renomeia `auth.tsx`; após login lista tenants do usuário e leva ao workspace.

Nova identidade visual leve reaproveitando os tokens do design atual (sem virar "marketing genérico").

### 3. Rotas do app viram tenant-scoped
- Mover `src/routes/_authenticated/*` para `src/routes/_authenticated/t.$slug/*`.
- Layout `t.$slug/route.tsx`: `beforeLoad` valida sessão + membership no tenant, injeta `tenant` no contexto e no `AppShell`. Sem membership → redireciona para `/account`.
- Todos os `Link`/`navigate` internos passam a usar `params={{ slug }}`.
- Todas as queries dos módulos filtram por `tenant_id` (o RLS já garante, mas a query também para performance/clareza).

### 4. Conta do usuário (fora do tenant)
Nova rota `/account`:
- Lista os workspaces (tenants) que o usuário possui/pertence.
- Mostra plano atual, seats usados/contratados, botão de "adicionar admin" (envia convite por e-mail — MVP: gera link/token na tela).
- Aba "Plano": exibe R$ 79 base + R$ 30 × extras, permite ajustar quantidade de seats (grava em `subscriptions`, sem cobrança).
- Aba "Administradores": convida/remove admins do tenant respeitando o limite de seats.

### 5. Ajustes finos
- `src/lib/nav.ts`: itens passam a receber o slug atual.
- `AppShell`: mostra nome do tenant no topo + trocador de workspace.
- `admin-bootstrap.functions.ts`: cria também o **tenant demo** (`demo`) com owner `admin@admin.com`, seats=3, e vincula `user@user.com` como member desse tenant. Os dados demo existentes recebem `tenant_id` do tenant demo.
- Command palette e AI assistant passam a operar no escopo do tenant atual.

## Fora do escopo (fica para depois)
- Cobrança real (Stripe/Paddle).
- Subdomínio wildcard real.
- Convites por e-mail com Resend (agora só link/token na UI).
- Planos adicionais.

## Detalhes técnicos
- Helper SQL `public.current_tenant()` retorna `tenant_id` a partir de `tenant_members` cruzando com `auth.uid()` e o slug lido do path — como o slug não chega ao Postgres, na prática as policies farão `EXISTS (SELECT 1 FROM tenant_members WHERE user_id = auth.uid() AND tenant_id = row.tenant_id)`. Simples e seguro.
- `has_role(_user_id, _tenant_id, _role)` reescrita.
- Todos os `createServerFn` protegidos passam a receber `tenantId` no input e validar membership antes de qualquer leitura/escrita.
- Rotas públicas (`/`, `/pricing`, `/signup`, `/login`) não usam `requireSupabaseAuth` e são SSR-friendly (bom para SEO da landing).
- `/` deixa de redirecionar para `/dashboard`: passa a ser a landing.
