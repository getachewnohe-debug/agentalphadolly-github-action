# Agent Alpha Dolly — Grok GitHub Action

GitHub Action that uses **Grok (xAI)** to automatically:

- Review pull requests
- Suggest labels / triage issues
- Post helpful comments

Part of the **Agent Alpha Dolly** ecosystem.

## Usage

### 1. Add secrets to your repository

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|--------|-------------|
| `XAI_API_KEY` | Your xAI API key from https://console.x.ai |

### 2. Create the workflow file

Add `.github/workflows/grok-review.yml` to any repo:

```yaml
name: Grok PR Review (Agent Alpha Dolly)

on:
  pull_request:
    types: [opened, synchronize, reopened]
  issues:
    types: [opened]

jobs:
  grok:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4

      - name: Grok Review / Triage
        uses: getachewnohe-debug/agentalphadolly-github-action@main
        with:
          xai-api-key: ${{ secrets.XAI_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          mode: auto   # auto | review | triage
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `xai-api-key` | yes | — | xAI Grok API key |
| `github-token` | yes | — | GitHub token (usually `secrets.GITHUB_TOKEN`) |
| `mode` | no | `auto` | `auto`, `review`, or `triage` |
| `model` | no | `grok-3` | Grok model to use |

## How it works

1. On PR open/update → fetches the diff and asks Grok for a short code review.
2. On new issue → Grok suggests labels and a short triage comment.
3. Posts the result as a comment using the GitHub API.

## Related

- [agentalphadolly-grok](https://github.com/getachewnohe-debug/agentalphadolly-grok) — full interactive Grok agent
- [Agent-alpha-dolly](https://github.com/getachewnohe-debug/Agent-alpha-dolly) — brand / core

## License

MIT
