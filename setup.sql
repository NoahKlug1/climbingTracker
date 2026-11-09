-- CrimpLog v2.1 – einmalig im Supabase SQL Editor ausführen

-- 1) Klimmzug-Log: eine Zeile pro Tipp (reps = 0 bedeutet nur Gewichtsänderung)
create table if not exists pullup_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  log_date date not null default (now() at time zone 'Europe/Vienna')::date,
  reps int not null default 0,
  weight numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists pullup_log_user_idx on pullup_log (user_id, created_at desc);

alter table pullup_log enable row level security;
create policy "own select" on pullup_log for select using (auth.uid() = user_id);
create policy "own insert" on pullup_log for insert with check (auth.uid() = user_id);
create policy "own delete" on pullup_log for delete using (auth.uid() = user_id);

-- 2) Widget-Token (pro User ein geheimer Token für den Kurzbefehl)
create table if not exists widget_tokens (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  token uuid not null default gen_random_uuid()
);
alter table widget_tokens enable row level security;
create policy "own select" on widget_tokens for select using (auth.uid() = user_id);
create policy "own insert" on widget_tokens for insert with check (auth.uid() = user_id);

-- 3) Funktion für den Kurzbefehl: Reps dazurechnen und/oder Gewicht ändern
create or replace function add_pullup(p_token uuid, p_reps int default 0, p_weight_delta numeric default 0)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_weight numeric;
  v_today date := (now() at time zone 'Europe/Vienna')::date;
  v_total int;
begin
  select user_id into v_user from widget_tokens where token = p_token;
  if v_user is null then
    raise exception 'invalid token';
  end if;

  select coalesce((select weight from pullup_log where user_id = v_user order by created_at desc limit 1), 0)
    into v_weight;
  v_weight := v_weight + p_weight_delta;

  insert into pullup_log (user_id, log_date, reps, weight)
  values (v_user, v_today, greatest(p_reps, 0), v_weight);

  select coalesce(sum(reps), 0) into v_total from pullup_log where user_id = v_user and log_date = v_today;
  return json_build_object('today_reps', v_total, 'weight', v_weight);
end;
$$;

grant execute on function add_pullup(uuid, int, numeric) to anon, authenticated;
