# Security Policy

## Supported versions

Only latest `main` is supported in this bootstrap phase.

## Reporting a vulnerability

- Do not open public issues for seed handling vulnerabilities.
- Open a private security advisory in GitHub.
- Provide reproducible steps and affected package.

## Mandatory controls

- No seed/passphrase persistence.
- No sensitive logs.
- Sensitive buffers must be wiped after use.
- Network code isolated from recovery code.
