# CRM evolution plan — RSA Digital

## Safety boundary
- Work is developed on `feature/crm-foundation`; do not merge or deploy automatically.
- The current contract generator remains the source of truth for contract creation, viewing, acceptance, addenda and payments.
- No production database changes are applied by this branch.
- Existing English/Portuguese table pairs (`clients`/`clientes`, `contracts`/`contratos`) are not merged, renamed, deleted or backfilled until each record is traced to the running app.

## Existing CRM capabilities
- Client/lead records and status/tags.
- Next action and follow-up date.
- Contracts, renewal dates, contract views, addenda and payment tracking.

## Findings requiring attention before production changes
- The live database contains both English and Portuguese legacy tables. Current source code uses `clients` and `contracts`, while the Portuguese `contratos` table contains records. No consolidation or deletion is safe until the published app/version and record ownership are reconciled.
- Existing RLS policies are permissive: anonymous/public reads exist on `clients` and `contracts`; anonymous users can update rows in `contracts`; and `clientes`, `contratos` and `aditivos` have public `ALL` policies. These may be relied on by public contract view/acceptance flows, so do not remove them blindly. Map each public route and test token-based access before designing least-privilege replacements.
- Supabase Auth's leaked-password protection is disabled. Enable it in Auth settings as a separate security-hardening step after confirming account access.
- The Supabase advisor reported eight foreign-key indexes missing. Those are performance improvements, not blockers for CRM feature development; add only after checking query patterns.

## Proposed additions
1. Commercial proposals linked to the existing `clients` table, with status, scope, price, validity and optional link to the contract generated after acceptance.
2. Projects linked to the client, proposal and contract, with scope, lifecycle status, dates and closeout notes.
3. Activity history for calls, WhatsApp, emails, meetings, tasks, publication/review work and report delivery.
4. Monthly reports linked to a project, with review/rating, profile actions, website analytics, completed work and next steps.
5. Historical snapshots make month-over-month comparisons possible only after a baseline has been captured. Never infer growth from a single month's totals.

## Database draft
`supabase/migrations/20261009000100_crm_foundation.sql` is an additive migration draft. It has not been applied to Supabase. It adds four new tables with RLS scoped to the authenticated owner and indexes for common CRM lookups.

## Next implementation steps
- Verify the live deployment's branch/build and reconcile where the two existing data models are actually used.
- Review the migration against the project's real Auth/user model and test it in a non-production project first.
- Build CRM screens for proposals, activities, projects and monthly reports on this branch.
- Add an explicit accepted-proposal → existing contract generator handoff; do not silently auto-create contracts until the form payload and desired user confirmation are tested.
- Run build/tests and review the public contract acceptance/viewing flows before considering a pull request.
- Address existing broad public RLS policies as a separate security change after mapping which public contract routes depend on them.
