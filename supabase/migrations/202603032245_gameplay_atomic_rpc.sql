-- Adu Pintar migration: atomic gameplay RPC for answer and next progression

create or replace function public.submit_duel_answer(
  p_game_id uuid,
  p_player_id uuid,
  p_selected_answer integer,
  p_response_time_ms integer
)
returns table (
  accepted boolean,
  duplicate boolean,
  reason text,
  status text,
  question_id text,
  is_correct boolean,
  points_earned integer,
  base_points integer,
  speed_bonus integer,
  response_time_ms integer,
  difficulty text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game game_sessions%rowtype;
  v_snapshot jsonb;
  v_questions jsonb;
  v_player_answers jsonb;
  v_answer_group jsonb;
  v_player_orders jsonb;
  v_player_currents jsonb;
  v_question_started jsonb;
  v_player_slot integer;
  v_current_index integer;
  v_order jsonb;
  v_order_len integer;
  v_question_pos integer;
  v_question jsonb;
  v_question_id text;
  v_correct_answer integer;
  v_difficulty text;
  v_mode text;
  v_safe_response integer;
  v_selected integer;
  v_is_correct boolean;
  v_base integer;
  v_speed integer;
  v_total integer;
  v_scores integer[];
  v_started_at_ms bigint;
  v_now_ms bigint;
  v_existing_answer jsonb;
  v_default_answer jsonb;
begin
  select *
    into v_game
  from game_sessions gs
  where gs.id = p_game_id
  for update;

  if not found then
    return query select false, false, 'game_not_found', null::text, null::text, false, 0, 0, 0, 0, null::text;
    return;
  end if;

  if v_game.status <> 'in_progress' then
    return query select false, false, 'game_not_active', v_game.status, null::text, false, 0, 0, 0, 0, null::text;
    return;
  end if;

  v_player_slot := array_position(coalesce(v_game.player_ids, array[]::uuid[]), p_player_id);
  if v_player_slot is null then
    return query select false, false, 'player_not_in_game', v_game.status, null::text, false, 0, 0, 0, 0, null::text;
    return;
  end if;

  v_snapshot := case
    when jsonb_typeof(v_game.questions) = 'object' then v_game.questions
    else '{}'::jsonb
  end;
  v_questions := coalesce(v_snapshot->'questions', '[]'::jsonb);
  v_player_answers := coalesce(v_snapshot->'playerAnswers', '[]'::jsonb);
  v_player_orders := coalesce(v_snapshot->'playerQuestionOrders', '[]'::jsonb);
  v_player_currents := coalesce(v_snapshot->'playerCurrentQuestions', '[]'::jsonb);
  v_question_started := coalesce(v_snapshot->'questionStartedAt', '[]'::jsonb);

  if coalesce(v_player_currents->>(v_player_slot - 1), '') ~ '^-?[0-9]+$' then
    v_current_index := (v_player_currents->>(v_player_slot - 1))::integer;
  else
    v_current_index := 0;
  end if;
  if v_current_index < 0 then
    v_current_index := 0;
  end if;

  v_order := coalesce(v_player_orders->(v_player_slot - 1), '[]'::jsonb);
  if jsonb_typeof(v_order) <> 'array' then
    v_order := '[]'::jsonb;
  end if;
  v_order_len := jsonb_array_length(v_order);
  if v_order_len = 0 then
    v_order_len := greatest(coalesce(v_game.total_questions, 0), 0);
  end if;

  v_safe_response := greatest(0, least(coalesce(p_response_time_ms, 10000), 10000));
  if v_current_index >= v_order_len then
    return query select false, false, 'player_finished', v_game.status, null::text, false, 0, 0, 0, v_safe_response, null::text;
    return;
  end if;

  if coalesce(v_order->>v_current_index, '') ~ '^-?[0-9]+$' then
    v_question_pos := (v_order->>v_current_index)::integer;
  else
    v_question_pos := v_current_index;
  end if;
  if v_question_pos < 0 then
    v_question_pos := v_current_index;
  end if;

  if jsonb_typeof(v_questions) <> 'array' or v_question_pos >= jsonb_array_length(v_questions) then
    return query select false, false, 'question_unavailable', v_game.status, null::text, false, 0, 0, 0, v_safe_response, null::text;
    return;
  end if;

  v_question := v_questions->v_question_pos;
  v_question_id := coalesce(nullif(v_question->>'id', ''), format('legacy-%s-%s', v_game.id::text, v_question_pos::text));
  if coalesce(v_question->>'correctAnswer', '') ~ '^-?[0-9]+$' then
    v_correct_answer := (v_question->>'correctAnswer')::integer;
  elsif coalesce(v_question->>'correct_answer', '') ~ '^-?[0-9]+$' then
    v_correct_answer := (v_question->>'correct_answer')::integer;
  else
    v_correct_answer := 0;
  end if;

  v_difficulty := lower(coalesce(nullif(v_question->>'difficulty', ''), 'mudah'));
  if v_difficulty not in ('mudah', 'menengah', 'sulit') then
    v_difficulty := case
      when coalesce(v_question->>'points', '') ~ '^-?[0-9]+$' and (v_question->>'points')::integer >= 20 then 'sulit'
      when coalesce(v_question->>'points', '') ~ '^-?[0-9]+$' and (v_question->>'points')::integer >= 15 then 'menengah'
      else 'mudah'
    end;
  end if;

  while jsonb_array_length(v_player_answers) < v_player_slot loop
    v_player_answers := v_player_answers || jsonb_build_array('[]'::jsonb);
  end loop;
  v_answer_group := coalesce(v_player_answers->(v_player_slot - 1), '[]'::jsonb);
  if jsonb_typeof(v_answer_group) <> 'array' then
    v_answer_group := '[]'::jsonb;
  end if;

  if jsonb_array_length(v_answer_group) > v_current_index then
    v_existing_answer := v_answer_group->v_current_index;
  else
    v_existing_answer := null;
  end if;

  if v_existing_answer is not null and coalesce(v_existing_answer->>'questionId', '') = v_question_id then
    return query select
      false,
      true,
      'duplicate_answer',
      v_game.status,
      v_question_id,
      coalesce((v_existing_answer->>'isCorrect')::boolean, false),
      coalesce((v_existing_answer->>'pointsEarned')::integer, 0),
      coalesce((v_existing_answer->>'basePoints')::integer, 0),
      coalesce((v_existing_answer->>'speedBonus')::integer, 0),
      coalesce((v_existing_answer->>'responseTimeMs')::integer, v_safe_response),
      coalesce(v_existing_answer->>'difficulty', v_difficulty);
    return;
  end if;

  v_now_ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  if coalesce(v_question_started->>(v_player_slot - 1), '') ~ '^[0-9]+$' then
    v_started_at_ms := (v_question_started->>(v_player_slot - 1))::bigint;
  else
    v_started_at_ms := 0;
  end if;
  if v_started_at_ms > 0 and (v_now_ms - v_started_at_ms) > 12000 then
    v_selected := -1;
    v_safe_response := 10000;
  else
    v_selected := coalesce(p_selected_answer, -1);
    if v_selected < -1 or v_selected > 10 then
      v_selected := -1;
    end if;
  end if;

  v_mode := coalesce(v_game.mode, 'practice');
  v_is_correct := v_selected = v_correct_answer;
  if v_is_correct then
    v_base := case v_difficulty
      when 'sulit' then 20
      when 'menengah' then 15
      else 10
    end;
    if v_safe_response < 3000 and v_safe_response >= 500 then
      v_speed := 2;
    else
      v_speed := 0;
    end if;
    v_total := v_base + v_speed;
  else
    v_base := 0;
    v_speed := 0;
    if v_mode = 'competition' then
      v_total := -2;
    else
      v_total := 0;
    end if;
  end if;

  while jsonb_array_length(v_answer_group) < v_current_index loop
    v_default_answer := jsonb_build_object(
      'questionId', '',
      'answerIndex', -1,
      'isCorrect', false,
      'pointsEarned', 0,
      'basePoints', 0,
      'speedBonus', 0,
      'responseTimeMs', 10000,
      'difficulty', 'mudah'
    );
    v_answer_group := v_answer_group || jsonb_build_array(v_default_answer);
  end loop;

  v_existing_answer := jsonb_build_object(
    'questionId', v_question_id,
    'answerIndex', v_selected,
    'isCorrect', v_is_correct,
    'pointsEarned', v_total,
    'basePoints', v_base,
    'speedBonus', v_speed,
    'responseTimeMs', v_safe_response,
    'difficulty', v_difficulty
  );

  if jsonb_array_length(v_answer_group) = v_current_index then
    v_answer_group := v_answer_group || jsonb_build_array(v_existing_answer);
  else
    v_answer_group := jsonb_set(v_answer_group, array[v_current_index::text], v_existing_answer, false);
  end if;

  v_player_answers := jsonb_set(v_player_answers, array[(v_player_slot - 1)::text], v_answer_group, true);
  v_snapshot := jsonb_set(v_snapshot, '{playerAnswers}', v_player_answers, true);

  v_scores := coalesce(v_game.player_scores, array[]::integer[]);
  while coalesce(array_length(v_scores, 1), 0) < v_player_slot loop
    v_scores := array_append(v_scores, 0);
  end loop;
  v_scores[v_player_slot] := coalesce(v_scores[v_player_slot], 0) + v_total;

  update game_sessions gs
  set
    player_scores = v_scores,
    questions = v_snapshot
  where gs.id = v_game.id;

  if v_question_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    begin
      insert into game_answers (
        game_id,
        student_id,
        question_id,
        selected_answer,
        is_correct,
        response_time_ms,
        points_earned,
        speed_bonus
      )
      values (
        v_game.id,
        p_player_id,
        v_question_id::uuid,
        case when v_selected >= 0 then v_selected else null end,
        v_is_correct,
        v_safe_response,
        v_total,
        v_speed
      )
      on conflict (game_id, student_id, question_id) do nothing;
    exception
      when foreign_key_violation then
        null;
    end;
  end if;

  return query select true, false, 'ok', v_game.status, v_question_id, v_is_correct, v_total, v_base, v_speed, v_safe_response, v_difficulty;
end;
$$;

create or replace function public.advance_duel_question(
  p_game_id uuid,
  p_player_id uuid
)
returns table (
  advanced boolean,
  reason text,
  status text,
  winner text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game game_sessions%rowtype;
  v_snapshot jsonb;
  v_currents jsonb;
  v_orders jsonb;
  v_started jsonb;
  v_player_slot integer;
  v_current integer;
  v_limit integer;
  v_now_ms bigint;
  v_slots integer;
  v_i integer;
  v_i_current integer;
  v_i_limit integer;
  v_all_completed boolean;
  v_min_current integer;
  v_scores integer[];
  v_best_score integer;
  v_best_index integer;
  v_winner text;
begin
  select *
    into v_game
  from game_sessions gs
  where gs.id = p_game_id
  for update;

  if not found then
    return query select false, 'game_not_found', null::text, null::text;
    return;
  end if;

  if v_game.status <> 'in_progress' then
    return query select false, 'game_not_active', v_game.status, null::text;
    return;
  end if;

  v_player_slot := array_position(coalesce(v_game.player_ids, array[]::uuid[]), p_player_id);
  if v_player_slot is null then
    return query select false, 'player_not_in_game', v_game.status, null::text;
    return;
  end if;

  v_snapshot := case
    when jsonb_typeof(v_game.questions) = 'object' then v_game.questions
    else '{}'::jsonb
  end;
  v_currents := coalesce(v_snapshot->'playerCurrentQuestions', '[]'::jsonb);
  v_orders := coalesce(v_snapshot->'playerQuestionOrders', '[]'::jsonb);
  v_started := coalesce(v_snapshot->'questionStartedAt', '[]'::jsonb);

  while jsonb_array_length(v_currents) < v_player_slot loop
    v_currents := v_currents || jsonb_build_array(0);
  end loop;
  while jsonb_array_length(v_started) < v_player_slot loop
    v_started := v_started || jsonb_build_array(floor(extract(epoch from clock_timestamp()) * 1000)::bigint);
  end loop;

  if coalesce(v_currents->>(v_player_slot - 1), '') ~ '^-?[0-9]+$' then
    v_current := (v_currents->>(v_player_slot - 1))::integer;
  else
    v_current := 0;
  end if;
  if v_current < 0 then
    v_current := 0;
  end if;

  if jsonb_typeof(v_orders->(v_player_slot - 1)) = 'array' then
    v_limit := jsonb_array_length(v_orders->(v_player_slot - 1));
  else
    v_limit := greatest(coalesce(v_game.total_questions, 0), 0);
  end if;

  if v_current < v_limit then
    v_current := v_current + 1;
    v_currents := jsonb_set(v_currents, array[(v_player_slot - 1)::text], to_jsonb(v_current), true);
    v_now_ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
    v_started := jsonb_set(v_started, array[(v_player_slot - 1)::text], to_jsonb(v_now_ms), true);
  end if;

  v_slots := greatest(
    jsonb_array_length(v_currents),
    coalesce(array_length(v_game.player_names, 1), 0),
    coalesce(array_length(v_game.player_ids, 1), 0)
  );
  if v_slots <= 0 then
    v_slots := 1;
  end if;

  v_all_completed := true;
  v_min_current := null;
  for v_i in 0..(v_slots - 1) loop
    if coalesce(v_currents->>v_i, '') ~ '^-?[0-9]+$' then
      v_i_current := (v_currents->>v_i)::integer;
    else
      v_i_current := 0;
    end if;

    if jsonb_typeof(v_orders->v_i) = 'array' then
      v_i_limit := jsonb_array_length(v_orders->v_i);
    else
      v_i_limit := greatest(coalesce(v_game.total_questions, 0), 0);
    end if;

    if v_i_current < v_i_limit then
      v_all_completed := false;
    end if;

    if v_min_current is null or v_i_current < v_min_current then
      v_min_current := v_i_current;
    end if;
  end loop;

  v_snapshot := jsonb_set(v_snapshot, '{playerCurrentQuestions}', v_currents, true);
  v_snapshot := jsonb_set(v_snapshot, '{questionStartedAt}', v_started, true);

  if v_all_completed then
    v_scores := coalesce(v_game.player_scores, array[]::integer[]);
    v_best_score := null;
    v_best_index := null;
    for v_i in 1..coalesce(array_length(v_scores, 1), 0) loop
      if v_best_score is null or coalesce(v_scores[v_i], 0) > v_best_score then
        v_best_score := coalesce(v_scores[v_i], 0);
        v_best_index := v_i;
      end if;
    end loop;
    if v_best_index is not null then
      v_winner := (v_best_index - 1)::text;
    else
      v_winner := null;
    end if;

    update game_sessions gs
    set
      status = 'completed',
      ended_at = coalesce(gs.ended_at, now()),
      current_question_index = greatest(coalesce(v_min_current, 0), 0),
      questions = v_snapshot
    where gs.id = v_game.id;

    return query select true, 'ok', 'completed'::text, v_winner;
    return;
  end if;

  update game_sessions gs
  set
    current_question_index = greatest(coalesce(v_min_current, 0), 0),
    questions = v_snapshot
  where gs.id = v_game.id;

  return query select true, 'ok', v_game.status, null::text;
end;
$$;

revoke all on function public.submit_duel_answer(uuid, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.submit_duel_answer(uuid, uuid, integer, integer) to service_role;

revoke all on function public.advance_duel_question(uuid, uuid) from public, anon, authenticated;
grant execute on function public.advance_duel_question(uuid, uuid) to service_role;
