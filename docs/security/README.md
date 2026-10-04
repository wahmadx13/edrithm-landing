# Security requirements and current assurance

See ../rules/ED-007-security-and-tenancy.md and ADR-002/009/019/021. Preserve tenant
isolation, explicit authorization and audit boundaries. The operator application
must never gain tenant browsing, impersonation or privilege override.

This repository setup does not certify production readiness. Existing scaffold
security review has unresolved object-lifetime and schema-resolution findings;
production data access and dependent features require independent correction and
review. Health checks, static previews and local UI tests do not establish tenant
isolation, authentication, full authorization, deployment or native-device safety.

No production credentials are configured. Local env files are ignored; only
placeholder examples may be committed. Add feature-specific security checks and
independent review before shipping the corresponding boundary.
