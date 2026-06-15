create extension if not exists pgcrypto;

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  entry_type text not null default 'reflection'
    check (entry_type in ('reflection', 'podcast', 'exhibition', 'music', 'movement', 'reading', 'conversation', 'dream', 'other')),
  raw_text text not null,
  summary text not null default '',
  tags text[] not null default '{}',
  emotion text not null default 'neutral' check (emotion in ('positive', 'neutral', 'negative')),
  personality_indicators jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  source text not null default 'mobile-web',
  device text not null default 'unknown',
  occurred_at timestamptz not null default timezone('utc', now()),
  needs_retry boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists entries_occurred_at_idx on public.entries (occurred_at desc);
create index if not exists entries_entry_type_idx on public.entries (entry_type);
create index if not exists entries_tags_gin_idx on public.entries using gin (tags);
create index if not exists entries_personality_gin_idx on public.entries using gin (personality_indicators);
create index if not exists entries_context_gin_idx on public.entries using gin (context);
create index if not exists entries_raw_text_fts_idx
  on public.entries
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(raw_text, '') || ' ' || coalesce(summary, '')));

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at
before update on public.entries
for each row
execute function public.set_updated_at();

create or replace view public.personality_stats as
select
  date(occurred_at) as date,
  indicator.key as indicator,
  avg(
    case
      when indicator.value in ('true', 'false') then case when indicator.value = 'true' then 1 else 0 end
      else nullif(indicator.value, '')::numeric
    end
  ) as frequency
from public.entries,
  jsonb_each_text(personality_indicators) as indicator
group by 1, 2
order by 1 desc, 2 asc;
