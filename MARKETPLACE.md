# GhostCase — MCPize listing copy (draft; do not publish yet)

**Name:** GhostCase

**Summary:** Turn explicitly selected bug-artifact values into consistent fictional test fixtures, then locally check whether a declared failure predicate remains.

**Categories:** Developer Tools, Testing, Privacy & Security

**Full description:** GhostCase transforms UTF-8 JSON, explicitly configured CSV, and plain-text logs with deterministic rules. Shared entity namespaces keep fictional identifiers consistent across files. It produces a preservation manifest, local-only replacement mapping, and optional local reproduction comparison. It never uploads originals or mappings by default. It does not promise complete anonymization, privacy compliance, or automatic reproduction of arbitrary bugs.

**Tools:** `create_case`, `inspect_case`, `build_bundle`, `get_case`, `delete_case`.

**Required software:** Node.js 22+ for local CLI; an authenticated GhostCase account/token; an MCP client supporting Streamable HTTP for the hosted tools.

**Privacy/retention:** Only transformed artifacts are accepted by the hosted service. Raw source artifacts, mappings, and local reproduction output remain local unless a user separately shares them. Cases are account-scoped, retained for 24 hours in the configured persistent volume, then expired; user deletion removes the app’s retained case file immediately. Backups must exclude the GhostCase volume to avoid a longer backup-retention copy. Pseudonymized data and preserved relationships can still be identifying.

**FAQ:**
- Does it anonymize data? No. It applies explicit pseudonymization/removal rules and requires privacy review.
- Does it run customer code? No. Reproduction runs only locally using a user-selected executable and argument array.
- Is matching exit code enough? No; a marker or assertion signature is required.
- Can I send local paths through MCP? No. Remote tools cannot access them; use the authenticated transformed-artifact upload flow.

**Buyer request:** “Replace the customer account ID and email in these three selected fixtures, preserve the ID relationship, and tell me whether my `NORMALIZATION_BUG` assertion remains.”

**Corresponding result:** “Created a case with transformed JSON/CSV/log artifacts; preservation manifest reports the shared entity relationship and declared properties. Local runner result: `PRESERVED` only if `NORMALIZATION_BUG` appears in both runs; otherwise `NOT_PRESERVED` or `INCONCLUSIVE`. Privacy review remains required.”

**Proposed subscription:** Free: 10 bundles/month, 20 files/10 MiB per case, 24-hour retention. Pro: €19/month, 100 bundles/month, same conservative per-case limits. Meter one completed `build_bundle`, retry-safe; never meter status/inspection. This is a proposal only—not tied to MCPize until it supplies documented secure origin identity/billing integration. Measured local processing cost for a tiny synthetic case was below 0.1 s and no paid external API use; measure production storage/egress and CPU before final quotas.
