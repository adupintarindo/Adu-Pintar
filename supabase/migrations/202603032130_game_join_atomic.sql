-- Adu Pintar migration: atomic duel join slot claim

create or replace function public.claim_waiting_duel_slot(
  p_game_code text,
  p_player_id uuid,
  p_player_name text
)
returns table (
  joined boolean,
  game_id uuid,
  mode text,
  status text,
  player_slot integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_game game_sessions%rowtype;
  v_slot integer;
  v_player_ids uuid[];
  v_player_names text[];
  v_name_slots integer;
  v_player_name text;
begin
  v_code := upper(coalesce(btrim(p_game_code), ''));
  if v_code = '' then
    return query select false, null::uuid, null::text, null::text, null::integer;
    return;
  end if;

  select *
    into v_game
  from game_sessions gs
  where gs.code = v_code
  for update;

  if not found then
    return query select false, null::uuid, null::text, null::text, null::integer;
    return;
  end if;

  if v_game.status <> 'waiting' then
    return query select false, v_game.id, v_game.mode, v_game.status, null::integer;
    return;
  end if;

  if p_player_id = any(coalesce(v_game.player_ids, array[]::uuid[])) then
    return query select false, v_game.id, v_game.mode, v_game.status, null::integer;
    return;
  end if;

  v_player_ids := coalesce(v_game.player_ids, array[]::uuid[]);
  v_player_names := coalesce(v_game.player_names, array[]::text[]);

  select idx
    into v_slot
  from generate_subscripts(v_player_ids, 1) as idx
  where v_player_ids[idx] is null
  order by idx
  limit 1;

  if v_slot is null then
    return query select false, v_game.id, v_game.mode, v_game.status, null::integer;
    return;
  end if;

  v_name_slots := coalesce(array_length(v_player_names, 1), 0);
  if v_name_slots < v_slot then
    v_player_names := array_cat(
      v_player_names,
      array_fill('Menunggu...'::text, array[v_slot - v_name_slots])
    );
  end if;

  v_player_ids[v_slot] := p_player_id;
  v_player_name := coalesce(nullif(btrim(p_player_name), ''), format('Pemain %s', v_slot));
  v_player_names[v_slot] := v_player_name;

  update game_sessions gs
  set
    player_ids = v_player_ids,
    player_names = v_player_names,
    status = 'in_progress',
    started_at = coalesce(gs.started_at, now())
  where gs.id = v_game.id;

  return query select true, v_game.id, v_game.mode, 'in_progress'::text, v_slot;
end;
$$;

revoke all on function public.claim_waiting_duel_slot(text, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_waiting_duel_slot(text, uuid, text) to service_role;
