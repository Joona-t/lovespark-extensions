# Plan: `Joona-t/lovespark-extensions` monorepo

Based on `MONOREPO-RESEARCH.md`. Decisions: **archive now, delete later · public · latest work**.
Everything is scripted in `scripts/monorepo/` and is idempotent, so a crash can be re-run.

## Target layout

```
lovespark-extensions/            ← the existing Claude x LoveSpark/Extensions/ folder becomes this repo
  privacy/lovespark-adblock/       (manifest.json, PRIVACY.md, BUGS_AND_ITERATIONS.md, … as today)
  neurodivergent/…  reading/…  themes/…  productivity/…  Games/…  security/…
  infrastructure/lovespark-shared-lib/
  _archive/…                       (retired extensions keep their history here)
  README.md                        (index table: extension → folder → store link)
  .githooks/pre-commit             (ls-check on changed extension folders only)
```

## TODO

### 0. Safety first (nothing destructive before this is green)
- [ ] `brew install gitleaks git-filter-repo`
- [ ] Mirror-backup all 71 repos: `git clone --mirror` → `~/repo-backups/2026-10-08/*.git`, then tar to the **Mac Backuo** drive. Verify the count is 71 and each `git fsck` passes.
- [ ] Tarball the 49 no-git folders to the same backup.
- [ ] Resolve the duplicate `lovespark-notes` mapping (pick the canonical folder).

### 1. Capture the latest work in every repo
- [ ] In each of the 70 dirty repos, on its current branch: `git add -A` minus junk (`*.bak`, `_metadata/`, zips, `.DS_Store`), commit `chore: snapshot before monorepo import`, push the branch.
- [ ] Record per repo: import branch, SHA, commits ahead of main, and other unmerged branches (left behind in the archive, listed in the monorepo README).

### 2. Scrub for the public flip
- [ ] `gitleaks detect` on every repo's full history, plus `git log -p | grep -nE "/Users/"`.
- [ ] For each hit: if it's a real secret, rotate it **and** rewrite it (`filter-repo --replace-text`). If it's a home path, rewrite it to `~`. If a repo is too messy, import it as a squashed snapshot and note that in the README.
- [ ] Gate: a full-monorepo `gitleaks detect` after assembly must report 0 findings, or nothing gets pushed.

### 3. Assemble (local only, nothing pushed yet)
- [ ] `git init` in a fresh `~/lovespark-extensions-build/`.
- [ ] For each of the 71: clone → check out the import branch → `filter-repo --to-subdirectory-filter <category>/<name>` → `merge --allow-unrelated-histories`.
- [ ] Add the 49 local-only folders, one commit each (`import: <name> (first time in git)`).
- [ ] Root `README.md` index, `.gitignore`, `LICENSE` (MIT), `.zipignore` conventions, root `BUGS_AND_ITERATIONS.md` (ITER-001 = this migration).
- [ ] Verify:
  - [ ] the file tree of every extension equals its source checkout (diff = 0)
  - [ ] `git log -- <path>` shows history for 5 sampled extensions
  - [ ] `ls-check` on 10 sampled extensions passes as before
  - [ ] `build-zips.sh` works for 3 sampled extensions

### 4. Tooling to monorepo mode
- [ ] `PRIVACY.md` URLs in all `CWS-LISTING.md`/`SUBMIT.md` → `github.com/Joona-t/lovespark-extensions/blob/main/<category>/<name>/PRIVACY.md` (scripted rewrite).
- [ ] `sync-shared-lib.sh`: one commit in the monorepo.
- [ ] Root pre-commit hook (`core.hooksPath .githooks`) runs `ls-check` on staged extension folders.
- [ ] Atlas: add the monorepo with per-folder audit mode (or accept one atlas page); drop the per-repo `atlas-update.yml` copies.
- [ ] Delete the nested `.git` dirs locally only after step 5 passes (they're in the mirror backup). The `Extensions/` folder becomes the monorepo working tree.

### 5. Publish
- [ ] `gh repo create Joona-t/lovespark-extensions --public`, then push `main` (gated on step 2's 0-findings check).
- [ ] In each of the 71 old repos: push a final `README.md` saying it moved to `lovespark-extensions/<category>/<name>` (keep `PRIVACY.md` so store links work), set the description to "📦 Moved to Joona-t/lovespark-extensions", then `gh repo archive`. Use the gh credential helper with a cooldown (rate limits).
- [ ] Verify: 71 repos archived, active repo count ≈ 193, a sample of 10 old `PRIVACY.md` URLs still return 200.

### 6. Delete later (separate session, your explicit go)
- [ ] Update the privacy-policy URL in every live CWS dashboard listing (manual, or `cws-autofill.py`).
- [ ] Re-verify the backups, then delete the archived repos in batches.

## Effort & risk
- Steps 0–4 are local and reversible: about one session of scripted runtime, mostly clones and history scans.
- Step 5 is public and outward-facing, but reversible (unarchive, or make the repo private).
- Step 6 is irreversible and stays gated on you.

**do not implement yet**
