# ApplyMate AI — Roadmap

Concise, ordered by intent. The product stays **review-first**: no roadmap item may introduce sending anything without explicit user approval.

## Done (MVP demo)

- Landing page with review-first positioning (EN/TR/DE)
- Control Center: engine status, trust metrics, approval-mode panel, onboarding checklist, next actions, usage & plan preview
- Profile Setup + Master CV Preview (mock)
- Review Queue with approve / decline / skip demo state (localStorage)
- Application Package builder (`/review?job=N`)
- Tracker pipeline + Inbox reply center with contextual actions and draft replies
- Typed dependency-free i18n (EN first, TR/DE), dark/light themes

## Next (product)

- [ ] Real AI generation architecture plan (Master CV → package tailoring → reply drafts)
- [ ] Cross-page session polish: richer tracker/inbox reactions to demo decisions
- [ ] Mobile/responsive fine-tuning pass
- [ ] TR/DE translation polish for newer English-first features

## Later (productization)

- [ ] Real AI API integration behind the existing package UX
- [ ] Accounts + persistence (replace localStorage demo state)
- [ ] Real job-source ingestion (compliant sources only)
- [ ] Email integration for the Inbox — approval-gated sending
- [ ] Pricing: Free / Pro with **application packages per month** as the unit (preview already on the Control Center); no payment flow before real value is live

## Non-goals

- Mass auto-apply / auto-submit modes
- Volume-based growth metrics
- Fake urgency, fake testimonials, or invented user counts
