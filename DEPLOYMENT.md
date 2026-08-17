# Deploying Digital Rx

Two accounts, both free to start: **Supabase** (database + login) and **Vercel**
(hosting). Budget about twenty minutes the first time.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Name it (for example `digital-rx`), choose a strong database password and keep it
   somewhere safe, and pick the region closest to the clinic — **Singapore** or
   **Mumbai** for Bangladesh.
3. Wait for the project to finish provisioning.

## 2. Create the tables

1. In the Supabase dashboard open **SQL Editor → New query**.
2. Paste the whole of `supabase/schema.sql`, press **Run**. It should report success.
3. New query again, paste `supabase/seed_medicines.sql`, **Run**. That loads the
   starting medicine catalogue (safe to re-run; it will not duplicate rows).

To confirm: **Table Editor** should now list `profiles`, `patients`, `prescriptions`,
`templates`, `medicines` and `medicine_catalog`.

## 3. Turn off email confirmation (recommended for a single user)

**Authentication → Sign In / Providers → Email**, and switch **Confirm email** off.
The account is created and signed in immediately. Leave it on if you would rather
verify the address — you will just need to click the emailed link before the first
sign-in.

While you are there, under **Authentication → URL Configuration**, set the site URL to
the address the app will live at (you can come back and change this after step 5).

## 4. Copy the two keys

**Project Settings → API**:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The anon key is meant to be public. Every table has row-level security keyed to the
signed-in user, so it grants no access on its own. Never put the `service_role` key
anywhere near this app.

## 5. Deploy to Vercel

**Option A — from GitHub (recommended, gives you automatic deploys)**

```bash
cd digital-rx
git init
git add .
git commit -m "Digital Rx"
git branch -M main
git remote add origin https://github.com/<you>/digital-rx.git
git push -u origin main
```

Then at <https://vercel.com/new>: import the repository, and before deploying add the
two environment variables from step 4 under **Environment Variables** (tick all three
environments — Production, Preview, Development). Press **Deploy**.

**Option B — straight from your machine**

```bash
npm i -g vercel
cd digital-rx
vercel            # answer the prompts, accept the detected Next.js settings
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

No build configuration is needed: Vercel detects Next.js and runs `next build`.

## 6. Create the doctor's account

Open the deployed URL. You will land on the sign-in page. Choose **Create an account**,
enter the doctor's email, a password of at least eight characters, and the name to show
in the header. You are taken to **Settings** — fill in the prescriber and clinic
details and save.

That one account is the whole practice. Do not share the password: every patient
record belongs to whoever signed up, and row-level security is what keeps them
private.

## 7. Calibrate the pad

Settings → **Print calibration** → **Print calibration sheet**. Hold the printed sheet
against a blank hospital pad and adjust the millimetre values until each dashed box
sits inside the pad's printed area. Save.

In the printer dialog, make sure **Scale = 100%** (not "Fit to page") and
**Margins = None**. Chrome remembers these per printer.

## 8. Check it end to end

1. New prescription → type a patient name.
2. Add a medicine with `Ctrl+K`, tick an investigation and an advice line.
3. **Print preview** — confirm the four blocks are where you expect.
4. **Save & print** onto a blank sheet, then hold it against the pad.
5. Open **Prescriptions** — the record should be there with a serial number.
6. Open **Patients** — the patient should have been created automatically.

---

## Backups

Supabase takes daily backups on paid plans. On the free plan, take your own
periodically: **Table Editor → prescriptions → Export as CSV**, or from a terminal:

```bash
pg_dump "postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" \
  --data-only --table=public.patients --table=public.prescriptions > backup.sql
```

Patient records are the one thing here that cannot be regenerated. Do this on a
schedule.

## Cost

Both platforms have free tiers that comfortably fit one clinic: Supabase gives 500MB of
database and 50,000 monthly active users, Vercel gives 100GB of bandwidth on the Hobby
plan. A prescription is a few kilobytes of JSON — tens of thousands of them fit in the
free database. Note that a free Supabase project is paused after a week with no
activity; a paid plan (currently around $25/month) avoids that and adds daily backups,
which is worth it once real patient data is in there.

## If something goes wrong

**Redirected to /login in a loop** — the environment variables are missing or wrong in
Vercel. Check both, then redeploy (changing an env var needs a new deployment).

**"Could not sign in"** — if email confirmation is still on, click the link in the
confirmation email first.

**Nothing prints, or the page prints instead of the overlay** — print from the app's
Print button rather than the browser menu, and check Scale is 100% with no margins.

**Text lands in the wrong place on the pad** — that is calibration, not a bug: adjust
the millimetres in Settings. If everything is uniformly shifted, the printer is scaling;
set Scale to 100%.

**"Text overflows" warning** — a block will not fit even at the smallest font. Shorten
it, or lower the minimum font size in Settings. The app deliberately refuses to print
rather than cut a prescription short.
