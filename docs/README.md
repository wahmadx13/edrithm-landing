# Technical documentation baseline

Read REPOSITORY-DECISION.md first. rules/ contains technical requirements;
security/ describes current assurance limits; architecture/ and adr/ preserve the
existing architecture reference. GLOSSARY.md defines domain terms.

These are the existing blueprint/rule baseline, copied on 2026-10-04. Documents
retain their original Draft/Proposed statuses; copying is not approval. Some
historical paths refer to the old monorepo: interpret them through the migration
decision. References to domain documents are design dependencies, not implemented
features. No rule's claim that a gate fails constitutes evidence that this repo
has that gate. Run this repo's documented checks and report their actual scope.

Changes to shared contracts, rules or decisions require affected consumer review
and explicit updates to each repository snapshot. No dependency imports a sibling
folder. Local team/task/session records do not belong in this repository.
