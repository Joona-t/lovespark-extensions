# Research: merge all Chrome extension repos into one monorepo

_2026-10-08 · inventory scripted from `gh repo list` + every local `Extensions/**/manifest.json`_

## Verdict

Doable in one scripted session with **zero data loss**. Collapsing 71 extension repos into one public
`Joona-t/lovespark-extensions` cuts the GitHub list from **263 → ~193 active**, and backs up **49 extensions
that currently exist only on this Mac**. The two real risks are (1) private history going public, and
(2) every store listing linking its privacy policy to the old repo. Archiving the old repos instead of
deleting them handles (2).

## Owner decisions (2026-10-08)

| Decision | Choice |
|---|---|
| Old repos | **Archive now, delete later**: delete only after every store listing points at the monorepo |
| Visibility | **Public** monorepo |
| Which code | **Latest work**: commit local changes on each repo's current branch and import that branch |

## The data

| Fact | Number |
|---|---|
| GitHub repos (Joona-t) | 263 (213 private, 50 public, 12 forks, 3 archived) |
| Local extension folders (`manifest.json`) | 124 |
| …with their own git repo + GitHub remote | **71** (8 public, 63 private) |
| …with **no git at all** (local-only, unbacked) | **49** (mostly `neurodivergent/`, `productivity/`, `reading/`, `privacy/`, `_archive/`) |
| Extension repos with uncommitted changes | 70 (most = 1 CSS file from a shared-lib sync; ~20 have 4–21 real files) |
| Extension repos whose current branch ≠ `main` | 64. Branches: `security/cso-hardening-2026-06-26` ×52, `fleet-p1` ×3, `fleet-p0` ×2, `assets/cws-icons-realui-2026-06-26` ×2, plus 3 one-offs |
| Total `.git` size of the 71 | ~194 MB (fine for one repo; no LFS needed) |
| CWS-LISTING/SUBMIT files linking `github.com/Joona-t/<repo>/blob/main/PRIVACY.md` | 73 |
| Secret / home-path scanners installed | **none** (`gitleaks`, `git-filter-repo` missing) |

Raw inventory: `scratchpad/ext-detail.txt` (per repo: branch, dirty count, commits ahead of main, `.git` size, dirty file types).

## Findings

1. **Unmerged work is the norm, not the exception.** 52 repos sit on the June CSO-hardening branch, 1–3
   commits ahead of `main`. Importing `main` would silently drop that work, which is why we import the
   current branch.
2. **49 extensions have never been in git.** A monorepo gives them history and an off-machine copy for the
   first time. This is the biggest win of the whole move.
3. **The public flip exposes history, not just the latest files.** 63 private repos would have every past
   commit published. Previous incidents (memory: *scrub home paths before publishing*) show `~`
   paths leak into docs and scripts. Every history needs `gitleaks` plus a `/Users/` grep, and any hit gets
   rewritten (`git filter-repo --replace-text`) or imported as a squashed snapshot.
4. **Privacy-policy URLs are the store-compliance landmine.** Archived repos keep `blob/main/PRIVACY.md`
   reachable, so archiving is safe today. Deleting is only safe after (a) each `CWS-LISTING.md`/`SUBMIT.md`
   points at `lovespark-extensions/blob/main/<category>/<name>/PRIVACY.md` **and** (b) the privacy URL field
   is updated in each live CWS dashboard listing. (b) is a dashboard click; `cws-autofill.py` can drive it.
5. **Tooling assumes one repo per extension.** These need a monorepo mode:
   - `scripts/build-zips.sh` takes an extension path: works unchanged.
   - `scripts/sync-shared-lib.sh`: one commit instead of 71.
   - Per-repo `ls-check` pre-commit hooks: one root hook that runs `ls-check` on changed extension folders only.
   - Atlas nightly: audits whole repos. It needs a subfolder mode, or the monorepo becomes a single atlas page.
   - Per-repo `.github/workflows/atlas-update.yml`: drop it (the nightly cron is the source of truth).
6. **Duplicate mapping:** two local folders both point at `lovespark-notes`. Resolve which one is canonical before import.
7. **Bulk GitHub operations hit rate limits.** Memory: osxkeychain 401s after ~15 rapid pushes. Use the
   `gh auth git-credential` helper with a cooldown for the 71 pushes and archives.

## Technique

Per repo: `git clone` → check out the latest-work branch → `git filter-repo --to-subdirectory-filter <category>/<name>`
→ in the monorepo, `git merge --allow-unrelated-histories`. Full per-file history survives (`git log -- <path>` works).
The 49 local-only folders go in as one plain commit each. This is the standard approach (see the `git-filter-repo`
docs, "merging repositories" recipe); no history is rewritten except the path prefix and any scrubbed secrets.

## Not in scope

The other ~190 non-extension repos (apps, iOS, research, games). The same recipe could fold, say, iOS apps
into a second monorepo later.
