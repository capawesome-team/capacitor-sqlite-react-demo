# Capacitor SQLite Demo (React)

A tutorial-first CRUD app for expenses built with React, Ionic, Capacitor, and SQLite.

- [We also have a Angular version](https://github.com/capawesome-team/capacitor-sqlite-angular-demo)


## What this app includes

- Expense list view with total amount summary.
- Create, edit, and delete flows for expenses.
- Local persistence with SQLite using the Capawesome plugin.
- A delete flow that uses a transaction and writes a deletion log record.

The project is intentionally small so you can use it as a reference for SQLite integration patterns in Capacitor apps.

## Tech stack

- React 18
- Ionic React 8
- Capacitor 8
- Vite 8 (dev server and production build; output in `www` for Capacitor)
- [`@capawesome-team/capacitor-sqlite`](https://capawesome.io/plugins/sqlite/)
- `@sqlite.org/sqlite-wasm` for web runtime support

## Demo
https://github.com/user-attachments/assets/79fbfc91-5315-42be-8a70-3404ff44d884


## App routes

- `/` -> redirects to `/expenses`
- `/expenses` -> expense list page
- `/expenses/new` -> create expense page
- `/expenses/:id/edit` -> edit existing expense page

## SQLite schema

The app creates a single database file: `expenses.sqlite3`.

Schema is initialized in one version (`version: 1`) with these tables:

- `expenses`
  - `id`, `title`, `category`, `amount`, `expenseDate`, `notes`, `createdAt`, `updatedAt`
- `application_logs`
  - `id`, `expenseId`, `deletedAt`

This demo does not create extra indexes beyond primary keys.

## SQLite examples implemented in this app

### 1) Open database and create schema

`databaseService` opens the DB and runs the initial schema with `upgradeStatements`.

### 2) Generic query helper

`databaseService.query<T>(statement, values)` wraps `Sqlite.query(...)` and returns typed rows.

Used by `expensesService` for reads such as:

- `getAllExpenses()`
- `getExpenseById(id)`

### 3) Generic execute helper

`databaseService.execute(statement, values)` wraps `Sqlite.execute(...)` for inserts, updates, and deletes.

Used by `expensesService` for:

- `INSERT INTO expenses ...`
- `UPDATE expenses ...`
- `DELETE FROM expenses ...`
- `INSERT INTO application_logs ...`

### 4) Transaction example (multiple operations)

`expensesService.deleteExpense(...)` demonstrates a transaction:

- begins transaction
- inserts a deletion entry into `application_logs`
- deletes the expense from `expenses`
- commits transaction

`createExpense(...)` and `updateExpense(...)` are intentionally simple single-statement operations (no transaction/logging) to keep the demo easy to follow.

If any delete step fails, the code calls `rollbackTransaction()` and rethrows the error.

### 5) Connection lifecycle

The app opens the database at startup and closes it when the browser tab is unloading:

- `App` calls `databaseService.initialize()` on startup (with a loading shell until init finishes).
- `databaseService.close()` runs on `window` `beforeunload`.

## Demo design choices

This project intentionally stays minimal:

- Schema stays on `version: 1` for a clean demo setup.
- No multi-step migration chain.
- Only delete demonstrates transaction + logging.

## Project structure

```text
src/
  theme/
  pages/
    ExpenseListPage.tsx
    ExpenseListPage.scss
    ExpenseFormPage.tsx
    ExpenseFormPage.scss
  services/
    database.ts
    expenses.ts
  models/
    expense.model.ts
  App.tsx
  main.tsx
  global.scss
```

## Setup and run

### 1) Install dependencies

```bash
npm install
```

`postinstall` runs `copy:sqlite-wasm` so the web worker assets exist under `public/assets/sqlite-wasm`.

### 2) Configure Capawesome registry

The plugin is published on the Capawesome npm registry. Authenticate with your Capawesome license (see [Capawesome Insiders](https://capawesome.io/insiders/)):

```bash
npm config set @capawesome-team:registry https://npm.registry.capawesome.io
npm config set //npm.registry.capawesome.io/:_authToken <YOUR_LICENSE_KEY>
```

### 3) Run on web

```bash
npm start
```
or
```bash
ionic serve
```

### 4) Build and sync native projects

```bash
npm run build
npx cap sync
```

`prebuild` runs `copy:sqlite-wasm` before `npm run build`, so production builds include WASM assets.

### 5) Open native projects

```bash
npx cap open android
npx cap open ios
```

## Web runtime notes

- The web build uses `@sqlite.org/sqlite-wasm`.
- WASM files are copied from `node_modules/@sqlite.org/sqlite-wasm/dist` to `public/assets/sqlite-wasm` via `scripts/copy-sqlite-wasm.mjs`.
- COOP/COEP headers are set in `vite.config.ts` for local development (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`).
- On web, `databaseService` calls `Sqlite.initialize(...)` with a module worker before opening the database.

## Reset local data

If you want a clean demo state:

- Web: clear site data (IndexedDB/OPFS) in the browser devtools.
- Android/iOS: uninstall the app from the device/emulator and reinstall.
- For this demo, schema is recreated from `version: 1` at first launch.
