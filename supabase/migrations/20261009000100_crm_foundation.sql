-- CRM foundation: proposals, projects, activities, and monthly client reports.
-- Additive only. This migration is intentionally committed to a feature branch and
-- must be reviewed/tested before being applied to the production Supabase project.
-- Existing clients/contracts and public contract acceptance flows are not modified.

create table if not exists public.crm_proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled')),
  scope jsonb not null default '[]'::jsonb,
  summary text,
  total_value numeric(12,2) not null default 0 check (total_value >= 0),
  payment_terms text,
  valid_until date,
  sent_at timestamptz,
  responded_at timestamptz,
  response_notes text,
  contract_id uuid references public.contracts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  proposal_id uuid references public.crm_proposals(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  name text not null,
  status text not null default 'onboarding'
    check (status in ('onboarding', 'in_progress', 'waiting_client', 'paused', 'completed', 'cancelled')),
  scope jsonb not null default '[]'::jsonb,
  started_on date,
  target_end_on date,
  completed_on date,
  closeout_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.crm_projects(id) on delete cascade,
  activity_type text not null default 'note'
    check (activity_type in ('call', 'whatsapp', 'email', 'meeting', 'task', 'note', 'publication', 'review_reply', 'site_update', 'report_sent', 'other')),
  title text not null,
  details text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.crm_projects(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'sent')),
  reviews_total integer check (reviews_total is null or reviews_total >= 0),
  reviews_new integer check (reviews_new is null or reviews_new >= 0),
  rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  profile_actions integer check (profile_actions is null or profile_actions >= 0),
  website_sessions integer check (website_sessions is null or website_sessions >= 0),
  website_clicks integer check (website_clicks is null or website_clicks >= 0),
  calls integer check (calls is null or calls >= 0),
  messages integer check (messages is null or messages >= 0),
  work_summary text,
  next_steps text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_monthly_reports_period_check check (period_end >= period_start),
  constraint crm_monthly_reports_unique_period unique (project_id, period_start, period_end)
);

create index if not exists crm_proposals_owner_status_idx
  on public.crm_proposals (owner_id, status, created_at desc);
create index if not exists crm_proposals_client_idx
  on public.crm_proposals (client_id, created_at desc);
create index if not exists crm_projects_owner_status_idx
  on public.crm_projects (owner_id, status, created_at desc);
create index if not exists crm_projects_client_idx
  on public.crm_projects (client_id, created_at desc);
create index if not exists crm_activities_owner_due_idx
  on public.crm_activities (owner_id, due_at) where completed_at is null;
create index if not exists crm_activities_client_created_idx
  on public.crm_activities (client_id, created_at desc);
create index if not exists crm_monthly_reports_owner_period_idx
  on public.crm_monthly_reports (owner_id, period_start desc);

alter table public.crm_proposals enable row level security;
alter table public.crm_projects enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_monthly_reports enable row level security;

drop policy if exists "CRM owners manage proposals" on public.crm_proposals;
create policy "CRM owners manage proposals"
  on public.crm_proposals for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "CRM owners manage projects" on public.crm_projects;
create policy "CRM owners manage projects"
  on public.crm_projects for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "CRM owners manage activities" on public.crm_activities;
create policy "CRM owners manage activities"
  on public.crm_activities for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "CRM owners manage monthly reports" on public.crm_monthly_reports;
create policy "CRM owners manage monthly reports"
  on public.crm_monthly_reports for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.crm_proposals to authenticated;
grant select, insert, update, delete on public.crm_projects to authenticated;
grant select, insert, update, delete on public.crm_activities to authenticated;
grant select, insert, update, delete on public.crm_monthly_reports to authenticated;
