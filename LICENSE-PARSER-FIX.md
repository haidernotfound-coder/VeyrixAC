# Veyrix license parser fix

Deploy this source over the existing Vercel web project, keeping its current
environment variables, signing secret and database. Only lib/license.ts changed:
the key parser now respects fixed-width Base64URL fields, which may contain '-'.
The signature algorithm, expiry/revocation behavior, admin UI, database schema,
activation/download/heartbeat routes and update mechanism are unchanged.

Validation: 1000 generated keys successfully verified, including hyphens in
payloads and signatures; altered signatures were rejected. No full Next/Vercel
production deployment was performed here. No supplied test keys are included.
