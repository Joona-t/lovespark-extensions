# BUGS_AND_ITERATIONS -- LoveSpark Tab Counter

## v1.0.0 (2026-03-25)

### Initial Release
- Badge shows total open tab count, updates on tab create/remove/attach/detach
- Popup shows big count display + per-window breakdown
- Configurable warning threshold (default 20) with color escalation (pink -> orange -> red)
- 4 themes (Retro Pink, Dark, Beige, Slate)
- Sparky mascot, WCAG AA focus indicators, prefers-reduced-motion
- Zero innerHTML -- all DOM built via createElement API
- Permissions: storage + tabs
