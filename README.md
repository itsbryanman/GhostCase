<div align="center">

# 👻 GhostCase

### Keep the bug. Lose the real-world identifiers.

**Turn messy, sensitive bug artifacts into consistent fictional test fixtures — without quietly breaking the relationships that made the bug happen.**

[![MCPize](https://mcpize.com/badge/@itsbryanman/ghostcase)](https://mcpize.com/mcp/ghostcase)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Streamable_HTTP-8A2BE2)](https://modelcontextprotocol.io/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/status-active_development-orange)](#project-status)

**[Quick start](#quick-start) · [How it works](#how-it-works) · [MCP tools](#mcp-tools) · [Safety notes](#the-important-caveats)**

</div>

---

## The problem

You've got a real bug. You've got logs, API responses, maybe a CSV export. Everything needed to explain it is sitting right there — along with customer emails, account IDs, and other things that absolutely do not belong in a public issue or an AI chat.

Deleting every identifier isn't the answer either. If the same account ID appears in three files, that relationship might be the whole reason the bug reproduces.

**GhostCase gives you a middle ground.** You explicitly choose what to replace, it makes the replacements consistent, and you can test locally whether your failure condition still shows up.

No mystery AI scrubber. No claim that a regex magically makes data anonymous.

## What it does

- **Transforms JSON, CSV, and plain-text logs.** Rules are explicit, reviewable, and deterministic.
- **Keeps relationships intact when you ask it to.** A shared entity mapping can carry a fictional account ID across different files.
- **Leaves your originals alone.** Preview writes transformed copies, not edits to source files.
- **Shows its work.** Review a manifest and warnings before sharing anything.
- **Checks the bug locally.** Run a user-selected command against original and transformed fixtures, then compare a defined marker or assertion signature.
- **Offers an MCP interface.** Authenticated case creation, inspection, bundle building, retrieval, and deletion.

## How it works

```text
  Original artifacts          Explicit rules            Reviewable fixtures
  ──────────────────          ──────────────            ───────────────────
  events.json         ─┐
  accounts.csv        ─┼──►   GhostCase   ───────────►  Transformed copies
  application.log     ─┘                               + manifest + warnings
          │                                                    │
          └──── optional LOCAL reproduction comparison ◄───────┘
```

The local mapping file stays local. **Do not upload it or paste raw artifacts into an MCP conversation expecting GhostCase to sanitize them after the fact.**

## Quick start

Requires **Node.js 22+**.

```bash
git clone https://github.com/itsbryanman/GhostCase.git
cd GhostCase
npm ci
npm run build
```

Preview a transformation with the example policy and fixtures:

```bash
node dist/src/cli.js preview \
  --policy examples/policy.json \
  --out /tmp/ghost-preview \
  examples/events.json \
  examples/accounts.csv \
  examples/app.log
```

Review the generated files and `manifest.json` before using or sharing the output. The `.ghostcase.mapping.json` file is local-only and should never be shared.

> **Path note:** The commands above follow the existing project README's build layout. Check the compiled output paths after building if the repository layout changes.

## A concrete example

Suppose these three files refer to the same account:

```json
{"accountId":"acct-real-123","event":"NORMALIZATION_BUG"}
```

```csv
accountId,status
acct-real-123,failed
```

```text
account=acct-real-123 normalization failed
```

With explicit rules and a shared entity namespace, GhostCase can replace that identifier consistently across all three artifacts. The replacement is fictional, but the cross-file relationship remains useful for debugging.

**This is an illustrative example, not an actual generated output.** The exact replacements depend on your policy.

## Local reproduction checks

A clean-looking fixture is useless if it no longer triggers the problem.

```bash
node dist/src/cli.js reproduce --config examples/run.json
```

The runner executes a **user-selected local executable and argument array** against disposable fixture copies, with time and output limits. It does not execute commands embedded in the artifacts.

Results are reported as `NOT_RUN`, `PRESERVED`, `NOT_PRESERVED`, or `INCONCLUSIVE`. A matching nonzero exit code alone is not enough: configure a marker or assertion signature that actually represents the failure.

## MCP tools

GhostCase exposes these tools over authenticated Streamable HTTP:

| Tool | Purpose |
| --- | --- |
| `create_case` | Start an account-scoped case |
| `inspect_case` | Inspect case details |
| `build_bundle` | Build the transformed-artifact bundle |
| `get_case` | Retrieve case information |
| `delete_case` | Delete a case |

The self-hosted implementation uses bearer authentication. The application also exposes authenticated HTTP endpoints for creating cases, uploading transformed files, retrieving bundles, and deleting cases.

**Important:** Remote MCP tools cannot read files from your laptop or server just because you mention their paths. Transform locally first; upload only the reviewed output using the supported authenticated flow.

## The important caveats

GhostCase is **pseudonymization tooling, not guaranteed anonymization**. It doesn't automatically discover every secret or personal detail. Structure and relationships can themselves be identifying. You still need to review transformed fixtures before sharing them.

It currently supports UTF-8 JSON, configured CSV, and plain text — **not** PDFs, screenshots, binaries, archives, or automatic URL scraping. Local reproduction results are evidence about your configured test, not proof that every aspect of the original bug is preserved.

## Self-hosting

The project includes a `Dockerfile` and `compose.ghostcase.yml`. The supplied Compose setup assumes an existing Traefik network and must be configured with a strong bearer-token secret before public exposure.

The self-hosted service limits requests and case sizes, scopes cases to accounts, and expires case data after 24 hours in its configured storage. Operators must also exclude the data volume from backups if they want backup retention to match that window.

See the repository's deployment configuration and documentation before exposing it publicly.

## Project status

GhostCase is under active development. Local transformation, preview, and reproduction workflows are implemented. A self-hosted authenticated API/MCP service exists.

**MCPize managed hosting and paid subscription enforcement are not yet verified or connected.** A marketplace manifest exists, but it should not be interpreted as proof that marketplace billing or tenant identity integration is production-ready.

## Why GhostCase?

Because “just redact the logs” is easy advice until the thing you redacted is the reason the bug exists.

GhostCase is built around a simple idea: **make the smallest deliberate changes needed to share a useful test case, then verify what those changes did.**

---

<div align="center">

**Built by [Backwoods Development](https://github.com/itsbryanman)**

*Make the case. Keep the evidence. Protect what you can.*

</div>