<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Dashboard data tables are public-read only; all writes (replace on upload) go through a password-checked server function using the admin client, never browser writes. Why: team views without login, only admin can change data.
- Excel files are parsed in the browser (SheetJS) and sent as clean rows to `uploadDashboardData`; each upload replaces the whole base (single unified base, no canal split). Why: user runs one general base.
- Uploads persist official general rows and per-supervisor workbook snapshots separately through password-checked server functions. Why: team financial rows never enter official general totals.
- Derive team membership by normalized representative and family; ambiguous pairs use exact individual workbook rows in team views. Why: shared representatives must not be rejected or arbitrarily assigned.
- Supervisor-only uploads replace only submitted team snapshots; general rows and other team snapshots remain untouched. Why: incremental uploads preserve the official base.
- Shared composition returns separate general and team row sets for dashboard filters and supervisor performance. Why: selecting a team uses its exact split without double-counting general totals.
- Shared dashboard filter predicates live in a browser-safe module and are tested independently. Why: KPI and table views must share the same row selection.
- Dashboard tables share semantic table tokens and the Status indicator; native progress elements visualize family attainment. Why: consistent presentation without changing financial calculations.
- Browser-safe dashboard analytics group filtered representatives and build monthly history; the legacy history field meta_restante contains the workbook's Meta column. Why: compare revenue against the actual target without adding revenue to it.
- Monthly history remains a general consolidated series filtered only by period; row-level performance filters apply to KPIs, team performance, ranking and tables. Why: the history workbook has no representative, family or supervisor dimensions.
