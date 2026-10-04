# landing engineering instructions

Read [the repository documentation](docs/README.md) and README.md before changes. This is an independently installed and deployed repository. Do not introduce workspace dependencies, sibling imports, shared node_modules, or desk/persona files.

Run npm ci, then npm run verify. Verification includes lint, type checking, compiler regression tests, application tests, and a production build. Do not skip failing checks. Inherited prototype status does not imply design acceptance or security approval.

This repository owns only public marketing routes. Its Tangerine tokens are a pinned snapshot from the frontend repository: update from a reviewed version with provenance. Authentication links target NEXT_PUBLIC_APP_URL; do not add institutional or platform-operator dashboards here.

Configuration beginning NEXT_PUBLIC_ is browser-visible and must never contain secrets. Test user-visible changes with the supported locales, directions, themes, and keyboard interactions. Keep data displayed in prototypes explicitly demonstrative.
