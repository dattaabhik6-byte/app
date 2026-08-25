# OLI Employee Panel — Live Work & Priority

## Original problem statement
Enhance the existing Online Legal India employee panel with a production-style Live Work and Priority workflow. Work must use a persistent reverse countdown, transition to configurable buffer time at zero, support pause and buffer-expiry disposition workflows, update Priority immediately, preserve audit history, and keep the existing OLI visual interface unchanged.

## Architecture decisions
- React single-page experience with routes for `/employee/home/dashboard`, `/employee/live-work`, and `/employee/priority`.
- Browser `localStorage` is used as the persistent data layer for the requested demo employee setup.
- Timer remaining time is calculated from stored timestamps and configured work/buffer durations, not a decrement-only counter.
- Demo employee is Abhik Datta, Employee role, with 7 daily target and 17 records under Master ID `O4560694177LI`.

## User personas
- **Employee / Abhik Datta:** searches assigned OLI records, starts work, completes filings, pauses work, handles Priority recovery, and reviews performance.
- **TL / Manager (future):** configures durations, targets, assignment, evidence rules, and reporting.

## Core requirements (static)
- Preserve the existing blue sidebar, top navigation, search treatment, typography, spacing, table styling, and OLI branding.
- Show all 17 demo OLI records, with 12 Trademark records start-enabled for Abhik and ISO/GST records disabled.
- Support normal completion, buffer completion, pause-to-Priority, buffer-expiry-to-Priority, Priority transfer, target metrics, performance labels, and audit entries.
- Validate required disposition, sub-disposition, remark, and evidence for configured issue types.

## Implemented — 2026-08-25
- Added native OLI shell with Live Work and Priority sidebar navigation plus live Priority badge.
- Added persistent 17-record Master ID search and assignment-aware Live Work table.
- Added timestamp-based reverse work countdown, automatic red buffer phase, completion confirmation, and active work card.
- Added Pause and buffer-expiry disposition modals with dependent sub-dispositions and dynamic evidence validation.
- Added Priority queue, immediate count updates, transfer-to-Live-Work recovery, fresh timer attempts, metrics, activity history, and browser persistence.
- Added dashboard summary metrics for target, completion, remaining work, Priority, performance, buffer usage, and recovery.
- Added Trademark completion transfer selector with `TMA Draft Uploaded`, persisted as the filing next stage and audit event.

## Prioritized backlog
- **P0:** Manager/TL configuration screens and role-aware permissions.
- **P1:** Backend/MongoDB persistence for multi-device and multi-employee use.
- **P1:** Evidence upload storage and audit attachment preview.
- **P2:** Reporting date filters, average duration calculations, and export.
- **P2:** Additional existing OLI dashboard routes and menu destinations.

## Next tasks
1. Add manager configuration for employee targets, assignments, service durations, and evidence rules.
2. Move the browser state layer behind authenticated FastAPI endpoints and MongoDB persistence.
3. Add reporting page with daily filters and audit export.