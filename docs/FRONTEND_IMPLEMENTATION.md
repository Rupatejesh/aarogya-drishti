# Frontend Implementation Notes

This note describes the existing React, TypeScript, and Vite frontend. It is an implementation guide, not a replacement for the API, security, or clinical documentation.

## Design system

- The interface uses midnight and Eastern Ghats blues, royal/electric blue actions, ice-blue highlights, heritage-gold details, and soft-white text.
- Shared colors and spacing tokens live in `client/src/index.css`; application and workflow component styling lives in `client/src/App.css`.
- The launch, gratitude, Milky Way, role-introduction, and sign-in backgrounds use original CSS landscape layers (sunrise, mountain ridges, forest silhouettes, mist, and a star field). No external landscape images or map data are implied.
- The app uses an original mountain/community-smile/digital-node mark and the browser title `AAROGYA DRISHTI · Mana Aadivasi Aarogyam`.
- The Blue Universe canvas is a shared, decorative layer. It does not intercept clicks, contains no patient information, caps particle density, and honors reduced-motion settings.
- High contrast, larger text, and reduced motion are user preferences stored in local storage. The operating system's reduced-motion preference takes precedence for animation.

## Navigation flow

1. A fresh page load opens the language-aware launch screen. The saved language is the initial selection; selecting another language updates the saved preference.
2. The launch action opens a skippable curtain reveal and then the project acknowledgement screen. Reduced-motion mode skips the reveal.
3. Continuing from the acknowledgement opens a separate Milky Way interstitial; its button opens the existing sign-in flow.
4. Existing server session restoration remains authoritative. After the launch flow, a valid restored session can enter its server-authorized workspace; otherwise, the user signs in through the existing API.
5. A successful explicit sign-in displays a skippable introduction to all seven roles and platform benefits. The current role label and matching role scene are derived from the authenticated user's server-returned role; the introduction does not grant or change permissions.
6. Authentication, CSRF, cookies, role derivation, and API services remain unchanged.

## Components and role workspaces

- `client/src/App.tsx` owns launch, acknowledgement, sign-in, session restoration, shell navigation, accessibility controls, and network availability display.
- `client/src/components/BlueUniverse.tsx` owns the shared canvas particle field and pointer interaction.
- `client/src/components/PatientWorkflow.tsx` owns API-backed patient records, registration, consent, screening review, referrals, diagnostics, follow-up, aggregate reporting, GIS readiness, and SAMMAKKA preview.
- `client/public/aarogya-mark.svg` is the custom browser mark; `client/index.html` supplies the product title and theme metadata.
- Dashboard compositions are distinct for PATIENT, ASHA_WORKER, MEDICAL_OFFICER, and SPECIALIST. DISTRICT_OFFICER and ITDA_PROJECT_OFFICER use distinct report presentations backed by the existing authorized aggregate API. ADMIN remains limited to the supported account-provisioning view.
- The role supplied by the backend continues to determine navigation and available actions; the UI is not a source of authorization.

## Motion and accessibility

- Canvas animation uses `requestAnimationFrame`; listeners and frames are cleaned up when the component unmounts.
- Curtain, mountain mist, leaves, star field, and decorative petals are CSS-only. The curtain can be skipped, and motion can be reduced from the accessibility controls.
- Voice output is user-triggered through Web Speech API, waits briefly for the browser voice list, and only speaks when a voice for the selected language is available. It reports a localized fallback instead of speaking through a mismatched-language voice. Actual voice availability and audio were not verified in the current browser.
- Decorative layers are hidden from assistive technology and do not intercept pointer events.

## Integration gaps and truthful states

- The aggregate API does not provide GIS boundaries or mandal-level metrics. GIS is an integration-ready notice, not a live map.
- Network availability is displayed, but secure offline storage and synchronization are not implemented. No pending/synced status is presented.
- SAMMAKKA is an abstract preview awaiting design approval; no character or medical assistant behavior is finalized.
- An evidence-reviewed oral-health education library and interactive anatomy models are not connected in this frontend.
- Patient workflow completion remains based on server-returned records. No synthetic patient data, clinical outcomes, or geographic values are added by the visual redesign.

## Current refinement verification

- Frontend ESLint (`npm run lint`) passed.
- TypeScript and Vite production build (`npm run build`) passed.
- The integrated browser rendered the launch and language-selection screen with the new page title and brand mark. Session restoration requests returned HTTP 401 because no valid authenticated session was available in that browser; authenticated workspaces and the role introduction were therefore not verified.
- The browser-control tool did not accept the returned page identifier for subsequent interaction, so launch-to-login button transitions and 390/768/1024/1440 px responsive layouts were not verified in this pass.
- Telugu, English, and Hindi speech voice availability and audible output were not tested. No authenticated patient workflow was tested.

## Continuation checklist

1. Inspect the corresponding API and authorization contract before implementing an integration.
2. Use server-returned identity, workflow statuses, and authorized aggregates; do not infer access from navigation visibility.
3. Add matching English, Telugu, and Hindi keys in `client/src/i18n/language.ts` or `client/src/i18n/workflowTranslations.ts`.
4. Keep visual-only previews explicitly labeled until the relevant approved assets or services exist.
5. Run `npm run lint` and `npm run build` from `client/`; test authenticated workflows only with an authorized account and permitted data.
