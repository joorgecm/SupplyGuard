---
version: 1
slug: "frontend-src-app"
primary_target: "frontend/src/app"
related_targets: []
---

# Surface brief: SupplyGuard app (all authenticated screens + login)

Scope: login, dashboard, incidents list, incident detail, new incident, admin users. Mode: Operate.
Audience/job: operator logs a defective lot fast at the dock; engineer drives incidents to closure; admin manages users. Portfolio reviewers are secondary.
Constraints: UI copy in English; demo data is synthetic and labelled; no new backend endpoints.

## Direction contract

THESIS: The plant's own safety signage system (ISO 3864 colours and sign shapes) becomes the state language of incoming quality. Refuses the grey SaaS table with one blue accent.

OWN-WORLD: Signal black shell bar, warm concrete-grey ground, white work surfaces, flat colour, no gradients, almost no shadows. Safety yellow = needs attention (open), safety blue = mandatory action (analysis hollow, corrective action solid), safety green = safe condition (closed), safety red/orange = critical/high severity. Status signs keep ISO shapes: triangle, circle, square. Barlow Condensed caps for labels and headings, Barlow for text, mono only for part references and lots, tabular figures everywhere. Hazard tape only where a real hazard exists (critical open, overdue).

STORY: The visitor sees what needs attention now, understands the workflow step of every incident at a glance, and acts on the one next step their role allows.

FIRST VIEWPORT: Dashboard. Black top bar (mark, nav, user + role sign). Lead: the "days without a critical incident" safety board, large green panel with the day count, beside a column of live figures (open, critical open, average days to close). Below: oldest open incidents needing attention, supplier ranking chart, monthly intake by severity.

FORM: Safety signage / ISO 3864 colour code, candidate 6 of 7 on my ordered list, seed key 80324ac4. Raises: flat unmodulated colour, no shadows (from zoo map); one family at strict size steps (from bitmap specimen); rank by weight, case and one reversed plate per screen (from timetable rack); a changed state stays lit until noticed (from gate board); tabular figures for every quantity (from exposure record).

Signature interaction: the workflow rail on the incident detail, ISO signs joined by a tape that fills to the current step; a status change lights the new step and holds it.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
