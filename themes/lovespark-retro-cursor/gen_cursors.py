#!/usr/bin/env python3
"""Generate the Y2K Korean SVG cursor packs: 9 packs × {emoji, pointer} × 4 cursors = 72 SVGs.

    python3 gen_cursors.py              # all packs
    python3 gen_cursors.py --only honey-bunny

Each pack lives in packs/<name>.py and exposes generate(); shared drawing helpers
(svg, arrow, hand, ibeam, halo, anim_*) live in cursor_lib.py. The OG PNG packs
(retro-pink, sakura-peach, starlight-purple) come from gen_og_cursors.py.
"""
import importlib, os, sys

from cursor_lib import BASE

PACKS = ["honey-bunny", "cyworld-dotti", "coquette-ribbon", "strawberry-milk",
         "glossy-pearl", "bubble-boba", "phone-charm", "heart-locket", "cyber-butterfly"]


def generate(only=None):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    total = 0
    for pack in PACKS:
        if only and pack not in only:
            continue
        importlib.import_module(f"packs.{pack.replace('-', '_')}").generate()
        for variant in ("emoji", "pointer"):
            folder = os.path.join(BASE, f"{pack}-{variant}")
            files = sorted(f for f in os.listdir(folder) if f.endswith(".svg"))
            total += len(files)
            print(f"  ✓ {pack}-{variant}: {files}")
    print(f"\n✨ {total} SVG cursor files generated")


if __name__ == "__main__":
    args = sys.argv[1:]
    only = args[args.index("--only") + 1:] if "--only" in args else None
    generate(only)
