\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

-- Two doctors, created the way Supabase would create them.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com', '{"doctor_name":"Dr A"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com', '{"doctor_name":"Dr B"}');

select 'T01 signup trigger created both profiles: ' ||
  case when (select count(*) from public.profiles) = 2 then 'ok' else 'FAIL' end;

select 'T02 doctor_name copied from metadata: ' ||
  case when (select doctor_name from public.profiles
             where id = '11111111-1111-1111-1111-111111111111') = 'Dr A'
       then 'ok' else 'FAIL' end;

select 'T03 overlay_boxes default is complete: ' ||
  case when (select overlay_boxes -> 'advice' ->> 'top' from public.profiles limit 1) = '220'
       then 'ok' else 'FAIL' end;

-- ---------------------------------------------------------------- serials --
set role authenticated;
set "test.user_id" = '11111111-1111-1111-1111-111111111111';

insert into public.patients (user_id, name, mrn)
values ('11111111-1111-1111-1111-111111111111', 'Karim Ahmed', 'H-1042');

insert into public.prescriptions (user_id, patient_id, content, summary)
select '11111111-1111-1111-1111-111111111111', id, '{"v":1}'::jsonb, 'first'
from public.patients where name = 'Karim Ahmed';

insert into public.prescriptions (user_id, content, summary)
values ('11111111-1111-1111-1111-111111111111', '{"v":2}'::jsonb, 'second'),
       ('11111111-1111-1111-1111-111111111111', '{"v":3}'::jsonb, 'third');

select 'T04 serials run 1,2,3: ' ||
  case when (select string_agg(serial::text, ',' order by serial) from public.prescriptions) = '1,2,3'
       then 'ok' else 'FAIL got ' ||
       (select string_agg(serial::text, ',' order by serial) from public.prescriptions) end;

delete from public.prescriptions where summary = 'third';
insert into public.prescriptions (user_id, content, summary)
values ('11111111-1111-1111-1111-111111111111', '{"v":4}'::jsonb, 'fourth');

select 'T05 a deleted serial is never reissued: ' ||
  case when (select serial from public.prescriptions where summary = 'fourth') = 4
       then 'ok' else 'FAIL got ' ||
       (select serial from public.prescriptions where summary = 'fourth')::text end;

-- ------------------------------------------------------------------- RLS --
select 'T06 doctor A sees only their own prescriptions: ' ||
  case when (select count(*) from public.prescriptions) = 3 then 'ok' else 'FAIL' end;

set "test.user_id" = '22222222-2222-2222-2222-222222222222';

select 'T07 doctor B sees none of A''s prescriptions: ' ||
  case when (select count(*) from public.prescriptions) = 0 then 'ok' else 'FAIL' end;

select 'T08 doctor B sees none of A''s patients: ' ||
  case when (select count(*) from public.patients) = 0 then 'ok' else 'FAIL' end;

select 'T09 doctor B sees only their own profile row: ' ||
  case when (select count(*) from public.profiles) = 1
        and (select count(*) from public.profiles
             where id = '11111111-1111-1111-1111-111111111111') = 0
       then 'ok' else 'FAIL' end;

-- B's own serial numbering starts from 1, independently of A.
insert into public.prescriptions (user_id, content, summary)
values ('22222222-2222-2222-2222-222222222222', '{"v":1}'::jsonb, 'b-first');

select 'T10 each doctor numbers from 1: ' ||
  case when (select serial from public.prescriptions where summary = 'b-first') = 1
       then 'ok' else 'FAIL' end;

-- Writing a row that claims to belong to another user must be refused.
do $$
begin
  begin
    insert into public.patients (user_id, name)
    values ('11111111-1111-1111-1111-111111111111', 'Injected');
    raise exception 'T11 FAIL: cross-user insert was allowed';
  exception when insufficient_privilege then
    raise notice 'T11 cross-user insert refused by RLS: ok';
  end;
end $$;

select 'T12 shared catalogue is readable: ' ||
  case when (select count(*) from public.medicine_catalog) = 196 then 'ok' else 'FAIL' end;

do $$
begin
  begin
    insert into public.medicine_catalog (name, generic, category)
    values ('Fake', 'Fake', 'Fake');
    raise exception 'T13 FAIL: catalogue was writable';
  exception when insufficient_privilege then
    raise notice 'T13 catalogue is read-only: ok';
  end;
end $$;

-- ------------------------------------------------------------ view + rpc --
set "test.user_id" = '11111111-1111-1111-1111-111111111111';

insert into public.medicines (user_id, name, generic, strength, default_frequency)
values ('11111111-1111-1111-1111-111111111111', 'Napa Extend', 'Paracetamol', '665 mg', 'TDS');

select 'T14 medicines_all unions catalogue and own drugs: ' ||
  case when (select count(*) from public.medicines_all where name ilike '%napa%') >= 2
       then 'ok' else 'FAIL' end;

select 'T15 own drug carries its defaults through the view: ' ||
  case when (select default_frequency from public.medicines_all where name = 'Napa Extend') = 'TDS'
       then 'ok' else 'FAIL' end;

set "test.user_id" = '22222222-2222-2222-2222-222222222222';
select 'T16 the view hides another doctor''s drugs: ' ||
  case when (select count(*) from public.medicines_all where name = 'Napa Extend') = 0
       then 'ok' else 'FAIL' end;

set "test.user_id" = '11111111-1111-1111-1111-111111111111';
select 'T17 search_patients finds by name: ' ||
  case when (select count(*) from public.search_patients('karim')) = 1 then 'ok' else 'FAIL' end;

select 'T18 search_patients finds by MRN: ' ||
  case when (select count(*) from public.search_patients('H-104')) = 1 then 'ok' else 'FAIL' end;

select 'T19 empty search returns the recent list: ' ||
  case when (select count(*) from public.search_patients('')) = 1 then 'ok' else 'FAIL' end;

set "test.user_id" = '22222222-2222-2222-2222-222222222222';
select 'T20 search_patients is scoped to the caller: ' ||
  case when (select count(*) from public.search_patients('karim')) = 0 then 'ok' else 'FAIL' end;

-- ------------------------------------------------------------ constraints --
set "test.user_id" = '11111111-1111-1111-1111-111111111111';

do $$
begin
  begin
    insert into public.patients (user_id, name, mrn)
    values ('11111111-1111-1111-1111-111111111111', 'Someone Else', 'H-1042');
    raise exception 'T21 FAIL: duplicate MRN accepted';
  exception when unique_violation then
    raise notice 'T21 duplicate MRN rejected: ok';
  end;
end $$;

insert into public.patients (user_id, name, mrn) values
  ('11111111-1111-1111-1111-111111111111', 'No MRN One', ''),
  ('11111111-1111-1111-1111-111111111111', 'No MRN Two', '');
select 'T22 blank MRNs do not collide: ' ||
  case when (select count(*) from public.patients where mrn = '') = 2 then 'ok' else 'FAIL' end;

update public.patients set name = 'Karim A.' where name = 'Karim Ahmed';
select 'T23 updated_at trigger fires: ' ||
  case when (select updated_at > created_at from public.patients where name = 'Karim A.')
       then 'ok' else 'FAIL' end;

-- Deleting a patient must keep the prescription as a record.
delete from public.patients where name = 'Karim A.';
select 'T24 prescriptions survive patient deletion: ' ||
  case when (select count(*) from public.prescriptions where summary = 'first') = 1
       then 'ok' else 'FAIL' end;
select 'T25 the link is nulled, not cascaded: ' ||
  case when (select patient_id is null from public.prescriptions where summary = 'first')
       then 'ok' else 'FAIL' end;

-- Deleting the account removes everything belonging to it.
reset role;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
select 'T26 deleting a user cascades their data: ' ||
  case when (select count(*) from public.prescriptions
             where user_id = '11111111-1111-1111-1111-111111111111') = 0
       then 'ok' else 'FAIL' end;
