# Security Policy

## Supported versions

Only the latest released version of `@galhardoalex/add-agent-skills` receives security fixes.

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |
| older   | ❌        |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub:
[Security → Report a vulnerability](https://github.com/AlexGalhardo/add-agent-skills/security/advisories/new).

Please include:

- the affected version
- a description of the issue and its impact
- steps to reproduce, or a proof of concept

You will get an answer within **7 days**. Once a fix is released, the advisory is published and you are credited, unless you prefer otherwise.

## Scope

In scope:

- writing files outside the chosen skills folder (path traversal from a repository tree)
- leaking `GITHUB_TOKEN` / `GH_TOKEN`, for example in error messages
- the CLI fetching from anything other than `api.github.com` and `raw.githubusercontent.com`
- supply-chain issues in the published packages

Out of scope:

- the content of third-party skills. They are fetched from their official repositories at install time; report problems there. Review a skill before trusting it, as it instructs your agent.

## Supply chain

- The only runtime dependency is [`@clack/prompts`](https://github.com/bombshell-dev/clack), pinned to an exact version.
- npm releases are published from GitHub Actions with **Trusted Publishing** and **provenance**. You can verify a release with `npm audit signatures`.
- JSR releases are published from the linked GitHub repository via OIDC. No long-lived tokens are stored anywhere.
