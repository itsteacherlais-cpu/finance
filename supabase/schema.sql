-- ============================================================================
-- Meu Financeiro — schema do banco de dados (Supabase / Postgres)
--
-- Como usar: no painel do Supabase, vá em "SQL Editor" > "New query",
-- cole todo este arquivo e clique em "Run". Isso cria as tabelas, as regras
-- de segurança (cada usuária só vê os próprios dados) e algumas categorias
-- e formas de pagamento iniciais.
--
-- É seguro rodar este script mais de uma vez: os "if not exists" e
-- "or replace" evitam erro se algo já existir.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tabela: categorias
-- ----------------------------------------------------------------------------
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('entrada', 'saida', 'ambos')),
  cor text not null default '#8a6f52',
  icone text,
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Tabela: formas_pagamento
-- ----------------------------------------------------------------------------
create table if not exists public.formas_pagamento (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('dinheiro', 'cartao', 'pix', 'outro')),
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Tabela: transacoes
-- ----------------------------------------------------------------------------
create table if not exists public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  valor numeric(12, 2) not null check (valor > 0),
  data date not null,
  categoria_id uuid references public.categorias (id) on delete set null,
  forma_pagamento_id uuid references public.formas_pagamento (id) on delete set null,
  descricao text,
  recorrente boolean not null default false,
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Tabela: reservas_recorrentes
-- Guarda as despesas/receitas recorrentes já confirmadas (ou ajustadas
-- manualmente) pela usuária na tela "Reservas Inteligentes" (Fase 2).
-- ----------------------------------------------------------------------------
create table if not exists public.reservas_recorrentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  categoria_id uuid references public.categorias (id) on delete set null,
  frequencia text not null check (frequencia in ('mensal', 'quinzenal', 'trimestral', 'semestral', 'anual', 'personalizada')),
  intervalo_em_meses numeric(6, 2) not null default 1,
  valor_medio numeric(12, 2) not null,
  confirmada boolean not null default false,
  proxima_ocorrencia date,
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Tabela: atalhos_rapidos
-- Botões de acesso rápido que a usuária monta na tela de Ajustes, para
-- lançar em 1 toque os gastos mais comuns do dia a dia (Fase 3).
-- ----------------------------------------------------------------------------
create table if not exists public.atalhos_rapidos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rotulo text not null,
  tipo text not null check (tipo in ('entrada', 'saida')),
  categoria_id uuid references public.categorias (id) on delete set null,
  forma_pagamento_id uuid references public.formas_pagamento (id) on delete set null,
  valor_padrao numeric(12, 2),
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

-- Índices para acelerar as consultas mais comuns do dashboard.
create index if not exists transacoes_user_data_idx on public.transacoes (user_id, data desc);
create index if not exists transacoes_user_categoria_idx on public.transacoes (user_id, categoria_id);

-- ----------------------------------------------------------------------------
-- Segurança: Row Level Security (RLS)
-- Garante que cada usuária só consegue ler/alterar os próprios dados,
-- mesmo compartilhando o mesmo banco de dados.
-- ----------------------------------------------------------------------------
alter table public.categorias enable row level security;
alter table public.formas_pagamento enable row level security;
alter table public.transacoes enable row level security;
alter table public.reservas_recorrentes enable row level security;
alter table public.atalhos_rapidos enable row level security;

drop policy if exists "categorias_por_usuario" on public.categorias;
create policy "categorias_por_usuario" on public.categorias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "formas_pagamento_por_usuario" on public.formas_pagamento;
create policy "formas_pagamento_por_usuario" on public.formas_pagamento
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transacoes_por_usuario" on public.transacoes;
create policy "transacoes_por_usuario" on public.transacoes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reservas_recorrentes_por_usuario" on public.reservas_recorrentes;
create policy "reservas_recorrentes_por_usuario" on public.reservas_recorrentes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "atalhos_rapidos_por_usuario" on public.atalhos_rapidos;
create policy "atalhos_rapidos_por_usuario" on public.atalhos_rapidos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Categorias e formas de pagamento sugeridas
-- Roda automaticamente na primeira vez que a usuária faz login, criando
-- os itens iniciais sugeridos no briefing do projeto. Veja a função
-- "criar_dados_iniciais" mais abaixo.
-- ----------------------------------------------------------------------------
create or replace function public.criar_dados_iniciais()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- As cores abaixo vêm de uma paleta testada para ficar distinguível
  -- também para pessoas com daltonismo (veja src/lib/paletaCategorias.ts).
  insert into public.categorias (user_id, nome, tipo, cor) values
    (new.id, 'Salário', 'entrada', '#4f7a2e'),
    (new.id, 'Aulas particulares', 'entrada', '#c1704e'),
    (new.id, 'Curso Fluência Sem Medo', 'entrada', '#b8860b'),
    (new.id, 'Outras rendas', 'entrada', '#9c4a68'),
    (new.id, 'Mercado', 'saida', '#2f7bb8'),
    (new.id, 'Transporte', 'saida', '#9c5e28'),
    (new.id, 'Lazer', 'saida', '#1f8f7a'),
    (new.id, 'Carro (IPVA/manutenção)', 'saida', '#a34a3a'),
    (new.id, 'Casa', 'saida', '#4f7a2e'),
    (new.id, 'Saúde', 'saida', '#c1704e'),
    (new.id, 'Educação/Cursos', 'saida', '#b8860b'),
    (new.id, 'Assinaturas', 'saida', '#9c4a68'),
    (new.id, 'Roupas', 'saida', '#2f7bb8');

  insert into public.formas_pagamento (user_id, nome, tipo) values
    (new.id, 'Dinheiro', 'dinheiro'),
    (new.id, 'Cartão de crédito (próprio)', 'cartao'),
    (new.id, 'Cartão de crédito (namorado)', 'cartao'),
    (new.id, 'PIX', 'pix');

  return new;
end;
$$;

-- Dispara a função acima toda vez que uma nova usuária se cadastra.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.criar_dados_iniciais();
