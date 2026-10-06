#!/usr/bin/env python3
"""Regression check for BUG-001: store zips must be clean, flat and current.

Usage: python3 scripts/check-zips.py   (run from the repo root)
Exit 0 = all checks pass, 1 = at least one failure (printed).
"""
import json, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANNED_SUFFIXES = (".zip",)
BANNED_NAMES = {"CWS-LISTING.md", "SUBMIT.md", "BUGS_AND_ITERATIONS.md", ".DS_Store"}
BANNED_PREFIXES = ("cws-shots/", "scripts/", ".git/")


def main() -> int:
    errors: list[str] = []
    repo_version = json.loads((ROOT / "manifest.json").read_text())["version"]
    for flavor in ("chrome", "firefox"):
        zp = ROOT / f"lovespark-context-switch-{flavor}.zip"
        if not zp.exists():
            errors.append(f"{zp.name}: missing")
            continue
        z = zipfile.ZipFile(zp)
        names = z.namelist()
        for n in names:
            if n.endswith(BANNED_SUFFIXES) or n in BANNED_NAMES or n.startswith(BANNED_PREFIXES):
                errors.append(f"{zp.name}: must not contain {n}")
        m = json.loads(z.read("manifest.json"))
        if m["version"] != repo_version:
            errors.append(f"{zp.name}: manifest version {m['version']} != repo {repo_version}")
        has_gecko = "gecko" in m.get("browser_specific_settings", {})
        if flavor == "chrome" and has_gecko:
            errors.append(f"{zp.name}: chrome zip must not carry browser_specific_settings.gecko")
        if flavor == "firefox" and not has_gecko:
            errors.append(f"{zp.name}: firefox zip must carry browser_specific_settings.gecko")
        for ref in [m["background"]["service_worker"], m["action"]["default_popup"], *m["icons"].values()]:
            if ref not in names:
                errors.append(f"{zp.name}: manifest references {ref} but it is not in the zip")
        # Every shipped file must match the repo tree (except the per-flavor manifest).
        for n in names:
            if n.endswith("/") or n == "manifest.json":
                continue
            src = ROOT / n
            if not src.exists():
                errors.append(f"{zp.name}: {n} not in repo tree")
            elif src.read_bytes() != z.read(n):
                errors.append(f"{zp.name}: {n} is stale vs repo tree")
        print(f"{zp.name}: {len(names)} entries, manifest {m['version']}, gecko={has_gecko}")
    for e in errors:
        print("FAIL", e)
    print("check-zips:", "PASS" if not errors else f"{len(errors)} failure(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
