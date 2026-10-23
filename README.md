# Shalom · Christian Church

Mobile-first Bible reader and church management app. Brand: navy, gold, warm white and olive.

## Run locally

Run `npm run dev`, then open http://127.0.0.1:5173/. The homepage is the Bible. For the development administrator, visit `/signin-with-chatgpt?return_to=/panel`. The portable Vite profile supplies the test account `seedy@sites.test` as administrator only for local development; that identity and binding are not part of the production build.

## Identity and roles

Production uses Sites / ChatGPT sign-in. `SHALOM_ADMIN_EMAIL` must be configured in Sites runtime secrets with the owner's verified email. The administrator registers people and assigns account emails to disciple, cell leader, sector leader or pastor. No emails are sent. Users sign in with the assigned email. Unassigned or disabled accounts have no church access; they can still read the Bible and save their personal study markers.

The API validates authorization server-side. Disciples access their own person record and devotions. Leaders see their assigned cell, sector leaders their sector, and pastors church-wide information. Administrative bulk writes and account management are administrator-only. Leaders can record attendance and monthly reports within their scope. Disciples write their own chapter reflections; authorized leaders can review them and leave feedback. Legacy administrator devotional records are retained separately.

## Data and Bible

D1 stores church records with optimistic revisions, role assignments, authored devotions, leader feedback and account-owned highlights/bookmarks. Anonymous reading preferences and markers stay in that browser only. Bible text is bundled locally: 66 books, 1189 chapters of public-domain Reina-Valera 1909. Source, revision and attribution are in `public/bible/SOURCE.md`; regenerate with `python scripts/import-bible.py`. Empty verse placeholders in the source's versification are omitted; text is not generated or paraphrased. Speech uses the browser/device voice.

Apply generated migrations to local D1 after building (see starter scripts). Production publication applies migrations automatically. `node --experimental-strip-types tests/access.mjs` verifies role scopes. TypeScript and a production build pass. Local HTTP integration verified role assignment, devotional ownership, cross-cell denial, review feedback, report permissions and private study isolation. Browser visual QA was unavailable.

Word-template generation and automatic reminder delivery remain pending. Supply the actual .docx template before implementing its layout and field mapping. QR enrollment still uses the administrator's existing panel workflow; public self-enrollment is not enabled.
