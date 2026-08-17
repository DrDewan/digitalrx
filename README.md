# Digital Rx

A prescription workspace for a single doctor, built to print onto a pre-printed
hospital pad with millimetre precision.

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth) ·
deploys to Vercel.

---

## What it does

- **Consultation workspace** — chief complaints by body system, history, examination
  with vitals and anatomical regions, a full BMCH-style investigation requisition,
  medicines, diagnosis, advice, plan and follow-up. English / বাংলা throughout.
- **Prints onto the pre-printed pad** — the app prints *only* the doctor's text, at
  calibrated millimetre positions, so a blank A4 fed through the printer lands exactly
  inside the pad's printed boxes. Text auto-shrinks to fit and breaks onto further
  pages rather than being cut off.
- **Patients** — searchable by name, phone or MRN, with the full visit history and any
  past prescription reloadable in one click.
- **Prescriptions** — every one saved in full and reprintable byte-for-byte as issued,
  with a per-doctor running serial number.
- **Templates** — save a consultation you repeat and drop it into a new prescription.
  Patient details are never stored in a template.
- **Medicine catalogue** — ~200 seeded Bangladeshi brand/generic pairs, searchable as
  you type, plus your own additions with your own default dose, frequency and duration.

## First run

You need a free Supabase project and a Vercel account. Full instructions are in
[`DEPLOYMENT.md`](./DEPLOYMENT.md); the short version:

```bash
npm install
cp .env.local.example .env.local     # then paste your Supabase URL and anon key
npm run dev                          # http://localhost:3000
```

Before the app will work, run `supabase/schema.sql` and then
`supabase/seed_medicines.sql` in the Supabase SQL editor.

## Calibrating the hospital pad

Settings → **Print calibration** holds the millimetre geometry of the four printed
blocks, measured from the top-left corner of the A4 sheet:

| Block                 | Default position         |
| --------------------- | ------------------------ |
| Disease (left column) | top 85mm, left 15mm, 80 × 110mm |
| Treatment (right)     | top 85mm, left 110mm, 85 × 110mm |
| Clinical diagnosis    | top 195mm, left 15mm, 180 × 25mm |
| Advice                | top 220mm, left 15mm, 180 × 40mm |

Press **Print calibration sheet**, hold the result against a blank pad, and nudge the
numbers until every block sits inside its printed area. The geometry is stored per
account, so a new pad needs no code change.

Two printer settings matter and are worth checking once: scale must be **100%**
(not "fit to page"), and margins **none**. The app already asks for A4 with zero
margins via `@page`.

## Keyboard

| Shortcut | Action |
| -------- | ------ |
| `Ctrl/⌘ + S` | Save |
| `Ctrl/⌘ + P` | Print |
| `Ctrl/⌘ + E` | Toggle print preview |
| `Ctrl/⌘ + K` | Jump to medicine search |
| `↑ ↓ ⏎` | Move through and pick a medicine |

## How it is put together

```
src/
  app/
    (app)/           signed-in area: rx, patients, prescriptions, templates, settings
    login/           email + password
  components/
    rx/              workspace, panels, and the print sheet
    ui.tsx           panel, field, modal, toast, confirm-button
  lib/
    actions/         server actions — every write goes through one
    clinical/        the complaint / investigation / advice lists, as data
    rx/
      types.ts       RxDraft: the one shape for the form, the database and templates
      compose.ts     consultation → the four printed blocks (pure strings)
      overlay.ts     the fit-and-paginate engine (pure; DOM behind an interface)
      store.ts       zustand store, with a local autosave of the working draft
    supabase/        browser, server and middleware clients
supabase/
  schema.sql         tables, row-level security, triggers
  seed_medicines.sql the starting formulary
```

Three decisions worth knowing about:

**Everything a prescription contains is one JSON document** (`RxDraft`). The form edits
it, the database stores it verbatim, a template is one with the patient stripped out,
and a reprint replays it. There is no second representation to drift out of step, and
`migrateDraft` means an old record always opens.

**The overlay engine is pure.** `layoutSection` takes a `Measurer` interface rather than
an element, so the fit-and-break logic is unit-tested without a browser and the DOM
implementation is four lines.

**Advice lines have permanent ids.** The original keyed them by array position, so
adding a line to the library would have silently changed what an already-issued
prescription said. Reword them freely; never reuse an id.

## Safety notes

- The seeded catalogue carries **no dose, frequency or duration**. Those fields are
  filled by the prescriber, and any default stored against a drug is one the doctor
  saved themselves. Strengths in the seed are a starting point and should be checked
  against the current product.
- Row-level security is enforced in Postgres on every table, keyed to `auth.uid()`.
  The anon key in the browser cannot reach another account's rows.
- An unsaved consultation is mirrored to `localStorage` and offered back after a crash
  or an accidental refresh. It is cleared the moment the prescription is saved.
- If any block will not fit even at the minimum font size, the app refuses to print and
  says which block overflows, rather than quietly cropping a prescription.

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Regression tests for the print layout engine |

## Tests

`npm test` exercises the part that would hurt most if it broke: the fit-and-break
engine that decides what lands on the pad. It asserts that no character is ever
dropped, that a page never ends mid-word, and — the one that matters — that shrinking
a long consultation and then editing it back down re-measures at the correct leading
rather than silently cropping the tail.

The database can be verified too, without touching your live project. Against any
local PostgreSQL 15+:

```bash
createdb rxtest
psql -d rxtest -f supabase/test_shim.sql        # stands in for Supabase auth
psql -d rxtest -f supabase/schema.sql
psql -d rxtest -f supabase/seed_medicines.sql
psql -d rxtest -f supabase/schema_test.sql      # 26 assertions
```

It covers row-level security between two doctors, that serial numbers never repeat
after a delete or under concurrent saves, that deleting a patient keeps their
prescriptions as records, and that the shared medicine catalogue is read-only.
