# Frontend architecture

`src/app` owns providers, the router and its type registration. File routes live in
`src/routes`; they own URLs, search validation and loaders, and the router plugin code-splits
their components.
Keep URLs and loader query options together here; features must not import app modules.

`src/pages/<Screen>` holds every component a route renders, and the page-only pieces around it.
`src/layout` owns the application shell. Neither is imported by features or shared code.

`src/features/<name>` owns domain APIs, query options, hooks, and the UI building blocks pages
compose. Features can use shared modules and `projects`, the core feature that supplies the
current project and its permissions. Other cross-feature imports are restricted to the explicit
exceptions in `eslint.config.js`: dashboard rows consume run UI; result forms consume test-case
queries; run hooks consume result queries. New feature directories are discovered automatically by
ESLint.

`src/components`, `src/hooks`, `src/api`, `src/auth`, `src/lib`, and `src/stores` are
shared infrastructure and cannot import features, pages, layout, or app composition.

## Server state

Query factories in feature API modules are shared by hooks and route loaders. Query
keys live in `src/api/queryKeys.ts`. Prefix invalidation covers descendants, including
details; avoid invalidating the same descendants again. Separate projections (such as
suite cases and the project-wide case catalog) each need invalidation. Remove cached
details and descendants after deletion. Test cache behavior with a real QueryClient
and query factories, mocking only transport/API operations.

## Forms and dialogs

`FormField` supplies label and feedback IDs through context. Use `FormInput`,
`FormSelect`, `FormTextarea`, or `useFormFieldAttributes` for custom controls, including
controls nested inside form controllers. Additional descriptions are preserved.
Raw native controls must provide their own matching ID and ARIA attributes. `Modal` uses the native dialog for focus trapping,
Escape dismissal, and focus restoration, with its heading as the accessible name.

## Notes

Each mounted `NoteEditor` owns one note; use `key={note.id}` when changing documents.
`useNoteAutosave` debounces edits, serializes writes, retains dirty state after failures,
and flushes the latest edit on unmount. Read-only editors do not initiate saves.
Browser unload prompts for unsaved edits; an async save cannot be guaranteed to finish
when the browser terminates the page.
