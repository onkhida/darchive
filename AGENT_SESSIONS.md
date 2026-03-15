Agent session log — interactive visuals (ClassificationPlot)

Overview
- Purpose: build interactive pedagogical SVG components (classification plot, vector playground) embedded in markdown articles.
- Framework: Vue 3 SFCs + TypeScript, mounted at runtime into markdown placeholders; Vite dev environment.

Session timeline (high-level)
- Architecture decision: Vue 3 + SVG (D3 optional for complex needs).
- Implemented interactive components under src/components/the-great-divide/:
  - ClassificationPlot.vue — click-to-add points, fixed weight vector, screen-space decision boundary, shaded halves.
  - VectorPlayground.vue — earlier interactive vector demo (exists in repo).
- Implemented runtime mounting pattern (markdown placeholders → registry → createApp mount).
- Iterated extensively on ClassificationPlot to fix UX and runtime issues.

Key discoveries & lessons
- Coordinate systems: computing decision boundary in screen space (not model space) ensures the dashed line is visually orthogonal to the displayed weight vector.
- SVG coordinate conversion: use svg.getScreenCTM() inverse + createSVGPoint to map client coordinates to SVG coordinates reliably (handles CSS transforms / layout scales).
- Vue list diffing: do not use array index as v-for key for dynamic insert/remove; use stable ids to avoid patched DOM mismatches.
- insertBefore null runtime error: often caused by mutating keyed lists while Vue is mid-patching. Mitigations included deferring updates (requestAnimationFrame) and replacing the array atomically ([...points, newPoint]).
- Touch/tap double-add: solved with a small timestamp debounce (250ms). Mobile pointer semantics can still vary.

Files touched
- src/components/the-great-divide/ClassificationPlot.vue (primary)
- src/components/the-great-divide/VectorPlayground.vue (earlier work)
- src/composables/useComponentRegistry.ts (registry that maps markdown placeholders to lazy components) — edited earlier, later reverted by user
- public/technical/2026-03-12-the-great-divide.md — placeholder mounts were added then reverted

State at session end
- ClassificationPlot.vue implemented and iterated; user reverted some theme edits afterwards.
- Insert-before intermittent error reduced but user reported it still appears occasionally; further hardening recommended.
- The user revoked some edits; be careful: next agent should always read current files before editing.

Outstanding issues / recommended next steps
1) Harden add-point flow further if insertBefore errors persist:
   - Options: increase debounce / ignore pointer events while a microtask lock is held; schedule mutation with Promise.resolve().then or setTimeout(0) as an alternative to RAF; or gate updates behind a small mutex.
2) Cross-device QA for pointer events (mobile Safari, Android Chrome) to confirm tap vs click behavior.
3) Make components theme-aware via CSS variables (was proposed and applied then revoked). Prefer using site-level variables and provide sensible dark-mode overrides.
4) Run a full TypeScript build (CI) to catch leftover unused-value warnings before deploying.

For the next agent (quick onboarding)
- Read these files first to see current state:
  - src/components/the-great-divide/ClassificationPlot.vue
  - src/composables/useComponentRegistry.ts
  - public/technical/2026-03-12-the-great-divide.md
- Reproduce steps:
  - Load the page containing the ClassificationPlot, click/tap repeatedly, observe whether 'insertBefore null' appears in console.
  - Try rapid taps and touch events on mobile to reproduce double-add.
- Prioritize: fix insert/patch race (mutex/defer), then implement theme variables.

Notes & inferences
- The site uses Tailwind and a markdown-driven content pipeline with runtime component injection; avoid permanent changes to article markdown without confirming user's intent.
- User prefers conservative edits and will manually revert changes they dislike; prefer small, easily reversible edits and document them in this log.

If you want, I can now add a brief checklist or a short patch to implement a microtask mutex around point-add to further reduce the insertBefore error. Otherwise this log should help the next agent pick up where we left off.
