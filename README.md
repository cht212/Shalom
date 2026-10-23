# Shalom · Comunidad

Mobile-first church management site, deployed privately through Sites.

Implemented: durable D1 records, administrator-created sectors and cells, people, daily attendance with duplicate checks, cell QR codes and registration flow, monthly reports with automatically calculated data, CSV export, devotional records, JSON backups and a separate fictional demo.

Access is currently restricted by the owner-only Sites policy. Every API operation requires authenticated identity. Do not expand site access until server-side per-role authorization is implemented. Cell leaders and members do not yet have individual accounts or restricted panels. QR onboarding currently requires owner access. Reminder delivery and Word-template generation are not enabled; obtain the actual .docx template before implementing its layout and field mapping.

The complete church record uses optimistic revision checks to prevent conflicting edits from silently overwriting each other. Browser-local state is not the source of truth.

Validation: TypeScript, production build and local HTTP integration checks covering authorization, persistence, optimistic concurrency and invalid requests. A connected browser was unavailable for visual QA.
