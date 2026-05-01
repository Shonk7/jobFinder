# Contributing

## Branch naming

Use one of the following prefixes:
- `feature/` — new functionality
- `fix/` — bug fixes
- `chore/` — maintenance, dependency updates, tooling

## PR process

1. Open a PR against `main` or `staging`.
2. CI runs automatically: lint, typecheck, and tests must pass for both `backend` and `frontend`.
3. Request a review; at least one approval is required before merging.
4. Merge to `main` — the deploy-staging workflow triggers automatically and posts the staging URL as a step summary in the Actions run.

## Staging

The staging URL is printed to the GitHub Actions step summary after each push to `main`. Check the latest `Deploy to Staging` run for the Vercel preview link.

## Production

To release to production, create and push a semver git tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```

This triggers the `Deploy to Production` workflow, which requires manual approval via the `production` GitHub environment before deploying.
