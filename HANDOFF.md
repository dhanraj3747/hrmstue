# Sharing this project with a teammate

The app has two parts:
1. **The code** (this folder) — you send this.
2. **The MySQL database** — this is a separate server on each computer. Your teammate
   either rebuilds it from the code (easiest) or imports an exact copy you export.

---

## STEP 1 — Prepare the folder to send

Before zipping, delete the big auto-generated folders (they get recreated with `npm install`):

- Delete **`node_modules`**
- Delete **`.next`**

Keep everything else, **including the `prisma/` folder** (schema + migrations + seed) — this is
what lets your teammate rebuild the database.

Do NOT rely on sending your `.env` — it contains YOUR MySQL password. Your teammate will make
their own (Step 4). `.env.example` is already included as a template.

> Recommended instead of zipping: push to **GitHub** and have them `git clone` it. Same result,
> less hassle. (`node_modules` and `.env` are already git-ignored.)

---

## STEP 2 — What your teammate needs installed

- **Node.js 18+**  (https://nodejs.org)
- **MySQL 8+**  (MySQL Community Server, or XAMPP which bundles MySQL)

---

## STEP 3 — Teammate: unzip / clone and install

```bash
cd HRMS2
npm install
```

---

## STEP 4 — Teammate: create the database + connect

1. Create an empty database in MySQL:
   ```sql
   CREATE DATABASE hrms_db;
   ```
2. Create a file named **`.env`** in the project root with THEIR MySQL username/password:
   ```
   DATABASE_URL="mysql://root:THEIR_PASSWORD@localhost:3306/hrms_db"
   NEXT_PUBLIC_APP_NAME="Smart HRMS AI"
   ```
   (If the password has special characters like `@ # /`, URL-encode them, e.g. `@` -> `%40`.)

---

## STEP 5 — Teammate: build the database + run

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npm run dev
```

Open http://localhost:3000. Log in with the seeded accounts:
- Admin: **admin@redfoxa.com** / **admin123**
- Candidate: **gayatri@redfoxa.com** / **candidate123**

That's it — the teammate now has the full app with a working database and demo data.

---

## OPTIONAL — Send your EXACT data (instead of just demo seed)

If you want your teammate to have the *exact* records you currently have (not just the seed):

**You export:**
```bash
mysqldump -u root -p hrms_db > hrms_db.sql
```
Send `hrms_db.sql` along with the folder.

**Teammate imports** (after Step 4, INSTEAD of `db seed`):
```bash
mysql -u root -p hrms_db < hrms_db.sql
npx prisma generate
npm run dev
```

---

## View the database any time

```bash
npx prisma studio
```
Opens http://localhost:5555 — a visual editor for every table (employees, users, attendance,
payroll, payslip, invoice, vendor, job_opening, leave, message, candidate, reminder).

## Common gotchas
- **P1000 Authentication failed** -> wrong MySQL password in `.env`. Fix the password.
- **'ts-node' not recognized** -> not needed anymore; seed runs with `node prisma/seed.js`.
- App runs but login fails -> they skipped `npx prisma db seed` (no accounts created yet).
