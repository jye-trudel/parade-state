- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Supabase configuration


1. Sign up at https://supabase.com and create a new project.
   (for example, one of your projects might be hosted at
   `https://xgsyrtdzmtdtttipgzab.supabase.co`)
2. Create a table called `entries` with columns matching the
   `StatusEntry` type (id text primary key, fourD text, category text, startDate
   text, durationDays integer, notes text, archivedAt text, createdAt text,
   updatedAt text). You can also add an `upsert` policy to allow anonymous
   writes for testing.
3. In your project settings copy the **URL** and **anon key**.
4. Create a `.env` at the repo root and add:

   **Do not commit `.env` to version control** – it contains your anon key and
   other sensitive information. Keep `.env.example` around as a template.


   ```ini
   VITE_SUPABASE_URL=https://xgsyrtdzmtdtttipgzab.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci…
   ```

   > **Important:** set the same variables in your deployment platform (Vercel,
   > Netlify, etc.) so builds and runtime environments have access. Without them
   > the app will fall back to local storage and real‑time syncing will not work.

   Vite will expose these to the browser as `import.meta.env.VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```




Track Platoon 1 recruits by 4D (format like 1410 = platoon 1 / section 4 / bed 10).



Import the real Platoon 1 nominal roll (since not all 64 beds exist) from an XLSX file via an in-app upload button.



Enter a single Status per 4D (you selected single dropdown model): MC, LD, EX, RS, OUT_OF_CAMP, EX_STAY_IN.



Track start date + duration (days, inclusive) and auto-compute end date; auto-archive expired entries.



Generate the exact Telegram-ready text block (morning/evening) and support Copy + Share/Open Telegram (manual send).



Mobile-first responsive UI (iPhone) that also looks good on macOS.

Current repo state





Vite + React TS scaffold exists: [vite.config.ts](vite.config.ts), [index.html](index.html), [src/main.tsx](src/main.tsx), [src/App.tsx](src/App.tsx).



package-lock.json exists; root package.json appears missing and will be added to match the lockfile.

Roster / nominal roll import (XLSX)





Add an in-app Roster page to upload .xlsx.



Parse the first worksheet and accept either:





A 4D column (preferred), OR



Separate columns like Platoon, Section, Bed (we’ll compute 4D as 1 + section + bed with bed zero-padded to 2 digits).



Validation rules:





Platoon must be 1.



Section 1-4.



Bed 1-16.



Deduplicate 4Ds.



The roster defines:





Total strength shown in the output (defaults to roster.length, e.g. 50).



Which 4Ds are selectable/trackable (no entering statuses for non-existent beds).



Store roster in localStorage so it persists on your phone.

Data model (client-side)





Store everything locally (no backend) using localStorage.



StatusEntry:





fourD: string



category: 'MC'|'LD'|'EX'|'RS'|'OUT_OF_CAMP'|'EX_STAY_IN'



startDate: string (ISO YYYY-MM-DD)



durationDays: number (>=1)



endDate: string (derived: start + durationDays - 1)



notes?: string (optional; used for EX details like HL & RMJ, or any extra details)



Expiry:





Active if today <= endDate; archived otherwise.

UI / UX





Replace the Vite starter in [src/App.tsx](src/App.tsx) with:





Roster import screen (upload/replace roster, show roster count)



Quick Add/Edit status form (4D dropdown limited to roster)



Today’s Parade State grouped view matching your sample headings and line formats



Provide actions:





Copy message to clipboard



Share using navigator.share() (iOS-friendly) with fallback to copy

Date handling





Use date-fns to compute inclusive end date: end = addDays(start, durationDays - 1).



Display range: DDMMYYYY-DDMMYYYY.

Telegram output formatting





Implement buildTelegramMessage(activeEntries, roster, settings) that outputs your exact text block.



Counts can be 2-digit padded (e.g. 04) where you want.

Files add/change





Update [src/App.tsx](src/App.tsx)



Add:





[src/roster/importXlsx.ts](src/roster/importXlsx.ts) (XLSX parsing)



[src/types.ts](src/types.ts)



[src/storage.ts](src/storage.ts)



[src/date.ts](src/date.ts)



[src/telegram.ts](src/telegram.ts)



[src/components/*](src/components/)



Add root [package.json](package.json).

Other NTH





Import/export JSON backup



Fast “extend duration” / “duplicate entry” shortcuts



Basic lock screen

