# InmoCRM.AI ðŸ 

CRM inmobiliario nativo en IA. Plataforma SaaS multi-tenant con agente conversacional, bandeja omnicanal y gestiÃ³n inteligente de leads para inmobiliarias.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- **IA**: OpenAI GPT-4o + LangChain.js + pgvector (RAG)
- **Deploy**: Vercel (CI/CD con GitHub Actions)
- **Pagos**: Stripe + MercadoPago

## Setup local

### 1. Clonar el repositorio

```bash
git clone https://github.com/aminhatar01-dot/InmoCRM.AI-Claude.git
cd InmoCRM.AI-Claude
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

Variables mÃ­nimas para desarrollo:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

### 4. Configurar Supabase

1. CreÃ¡ un proyecto en [supabase.com](https://supabase.com)
2. EjecutÃ¡ la migraciÃ³n en el SQL Editor de Supabase:

```bash
# CopiÃ¡ el contenido de supabase/migrations/001_esquema_inicial.sql
# y ejecutalo en el SQL Editor de tu proyecto Supabase
```

3. CopiÃ¡ la URL y la clave anon de Settings â†’ API en tu `.env.local`

### 5. Iniciar en desarrollo

```bash
npm run dev
```

AbrÃ­ [http://localhost:3000](http://localhost:3000)

## Deploy a producciÃ³n

El deploy es automÃ¡tico via GitHub Actions:

- Push a `main` â†’ deploy en Vercel (producciÃ³n)
- Push a `develop` o apertura de PR â†’ deploy de preview

### Configurar secretos en GitHub

En Settings â†’ Secrets and variables â†’ Actions:

```
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```

## Estructura del proyecto

```
src/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ (marketing)/      # Landing, precios, blog
â”‚   â”œâ”€â”€ (autenticacion)/  # Login, registro, onboarding
â”‚   â”œâ”€â”€ (aplicacion)/     # App autenticada
â”‚   â””â”€â”€ api/              # API routes
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ compartidos/      # Layout, sidebar, etc.
â”‚   â”œâ”€â”€ bandeja/          # Inbox omnicanal
â”‚   â”œâ”€â”€ embudo/           # Pipeline Kanban
â”‚   â””â”€â”€ ...
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ supabase/         # Clientes Supabase
â”‚   â”œâ”€â”€ ia/               # Agente LangChain + RAG
â”‚   â””â”€â”€ canales/          # WhatsApp, Instagram, etc.
â”œâ”€â”€ hooks/                # Custom hooks
â””â”€â”€ types/                # Tipos TypeScript
supabase/
â”œâ”€â”€ migrations/           # SQL migrations
â”œâ”€â”€ functions/            # Edge Functions (Deno)
â””â”€â”€ seed.sql              # Datos de prueba
```

## Funcionalidades

- **Bandeja omnicanal**: WhatsApp, Instagram, Facebook, web â€” todo unificado con Supabase Realtime
- **Agente IA de ventas**: GPT-4o entrenado con tu catÃ¡logo, busca propiedades por semÃ¡ntica (pgvector)
- **Etiquetas Smart**: etiquetado automÃ¡tico de leads por IA
- **Embudo Kanban**: pipeline visual con drag-and-drop
- **CampaÃ±as masivas**: broadcast de WhatsApp con analÃ­ticas en tiempo real
- **Agenda de visitas**: sincronizaciÃ³n con Google Calendar
- **AnalÃ­ticas**: mÃ©tricas de conversiÃ³n, rendimiento por agente, consumo de tokens
- **Multi-tenant**: RLS en todas las tablas, aislamiento garantizado por `tenant_id`

## Endpoint de salud

```
GET /api/salud
```

## Licencia

Propietario â€” Â© 2024 InmoCRM.AI

