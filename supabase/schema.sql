-- =============================================================================
-- ESTÉTICA LARISSA SOARES - SUPABASE / POSTGRESQL SCHEMA
-- Especialidades Exclusivas: Estética & Cosmetologia | Massoterapia | Lash Design
-- =============================================================================

create extension if not exists "uuid-ossp";

-- 1. Configurações Gerais e Meios de Pagamento
create table if not exists public.clinic_settings (
  id uuid primary key default uuid_generate_v4(),
  clinic_name text not null default 'Estética Larissa Soares',
  professional_name text not null default 'Larissa Soares',
  professional_title text not null default 'Esteticista e Cosmetóloga • Massoterapeuta • Lash Designer',
  whatsapp_number text not null default '5511998765432',
  vip_group_url text not null default 'https://chat.whatsapp.com/EsteticaLarissaSoaresVIP',
  instagram_url text not null default 'https://instagram.com/esteticalarissasoares',
  tiktok_url text not null default 'https://tiktok.com/@esteticalarissasoares',
  address_line text not null default 'Av. Paulista, 1450 - Sala 804, Jardins — São Paulo, SP',
  google_maps_url text not null default 'https://maps.google.com/?q=Av.+Paulista,1450,Sao+Paulo',
  waze_url text not null default 'https://waze.com/ul?q=Av.%20Paulista%201450%20Sao%20Paulo',
  opening_hours text not null default 'Terça a Sexta: 09h às 19h • Sábado: 09h às 16h',
  -- Configurações de Pagamento
  pix_enabled boolean not null default true,
  pix_key text not null default 'contato@larissasoaresestetica.com.br',
  pix_holder name text not null default 'Larissa Soares Estética LTDA',
  credit_card_enabled boolean not null default true,
  credit_card_max_installments integer not null default 6,
  debit_card_enabled boolean not null default true,
  cash_in_person_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 2. Catálogo de Procedimentos (Exclusivo nas 3 áreas)
create table if not exists public.procedures (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('estetica', 'massoterapia', 'lash')),
  description text not null,
  benefits text[] not null default '{}',
  duration_minutes integer not null check (duration_minutes > 0),
  original_price numeric(10, 2) not null check (original_price >= 0),
  on_promo boolean not null default false,
  promo_price numeric(10, 2),
  promo_valid_until date,
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Base de Clientes (Cadastradas automaticamente no agendamento)
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  whatsapp text not null,
  email text not null,
  notes_allergies text default '',
  last_procedure_name text,
  last_category text check (last_category in ('estetica', 'massoterapia', 'lash')),
  last_visit_at date,
  total_appointments integer not null default 1,
  created_at timestamptz not null default now()
);

-- 4. Agendamentos (Online e Manuais)
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  client_whatsapp text not null,
  client_email text not null,
  notes_allergies text default '',
  procedure_ids text[] not null,
  procedure_names text[] not null,
  primary_category text not null check (primary_category in ('estetica', 'massoterapia', 'lash')),
  appointment_date date not null,
  start_time text not null, -- formato HH:MM
  end_time text not null,   -- formato HH:MM
  total_duration_minutes integer not null,
  total_amount numeric(10, 2) not null,
  payment_method text not null check (payment_method in ('pix', 'credit_card', 'debit_card', 'cash_in_person')),
  payment_timing text not null check (payment_timing in ('online_advance', 'in_person')),
  payment_status text not null check (payment_status in ('paid', 'pending')) default 'pending',
  status text not null check (status in ('confirmed', 'pending', 'completed', 'cancelled')) default 'pending',
  source text not null check (source in ('online', 'manual')) default 'online',
  created_at timestamptz not null default now()
);

-- 5. Bloqueios de Agenda (Almoço, Folgas, Férias)
create table if not exists public.schedule_blocks (
  id uuid primary key default uuid_generate_v4(),
  block_date date not null,
  start_time text not null,
  end_time text not null,
  reason text not null,
  block_type text not null check (block_type in ('lunch', 'day_off', 'vacation', 'custom')) default 'custom',
  created_at timestamptz not null default now()
);

-- 6. Fluxo de Caixa (Entradas de Agendamentos e Receitas/Despesas Manuais)
create table if not exists public.financial_transactions (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  transaction_date date not null,
  payment_method text not null,
  payment_status text not null check (payment_status in ('paid', 'pending')) default 'paid',
  appointment_id uuid references public.appointments(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 7. Templates de Disparo (WhatsApp & E-mail Marketing)
create table if not exists public.message_templates (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  channel text not null check (channel in ('whatsapp', 'email', 'both')),
  default_audience text not null default 'all',
  subject text,
  content text not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security (RLS)
alter table public.clinic_settings enable row level security;
alter table public.procedures enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.message_templates enable row level security;

-- Políticas de Leitura Pública para Site da Cliente
create policy "Public read clinic_settings" on public.clinic_settings for select using (true);
create policy "Public read active procedures" on public.procedures for select using (true);
create policy "Public read schedule_blocks" on public.schedule_blocks for select using (true);
create policy "Public create appointments" on public.appointments for insert with check (true);
create policy "Public create clients" on public.clients for insert with check (true);

-- Políticas Administrativas (Autenticado via Supabase Auth)
create policy "Admin full access clinic_settings" on public.clinic_settings for all using (auth.role() = 'authenticated');
create policy "Admin full access procedures" on public.procedures for all using (auth.role() = 'authenticated');
create policy "Admin full access clients" on public.clients for all using (auth.role() = 'authenticated');
create policy "Admin full access appointments" on public.appointments for all using (auth.role() = 'authenticated');
create policy "Admin full access schedule_blocks" on public.schedule_blocks for all using (auth.role() = 'authenticated');
create policy "Admin full access financial_transactions" on public.financial_transactions for all using (auth.role() = 'authenticated');
create policy "Admin full access message_templates" on public.message_templates for all using (auth.role() = 'authenticated');
