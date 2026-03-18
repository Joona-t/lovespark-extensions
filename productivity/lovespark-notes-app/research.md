# Research: Streamlined Hybrid Upgrade (Bear/iA Writer Model)

## What We're Building

Upgrade lovespark-notes from a 4-tab mobile layout (Notes, Search, Tags, Settings) to a **Streamlined Hybrid** single-screen architecture inspired by Bear and iA Writer. Two panes (list + editor), no sidebar, category filter tabs, command palette for search, list/grid toggle.

## Current Architecture (v1)

### Navigation
- **Bottom tab bar** with 4 tabs: Notes, Search, Tags, Settings
- **Note editor** is a full-screen push (`Stack.Screen` with slide_from_right)
- **FAB** floating + button for new notes (tap = blank, long-press = template sheet)

### Data Model
- `NoteEntry`: id, title, pinned, tags[], wordCount, snippet, createdAt, updatedAt, deletedAt
- `TagDefinition`: name, colour, createdAt
- **No category field** — filtering is tags-only
- Content stored separately in MMKV by key `note_{id}`
- Versions stored in MMKV by key `versions_{id}`

### Stores (Zustand + MMKV)
- `notesStore`: CRUD, filterNotes, pinning, versions, garbage collection
- `tagStore`: tag CRUD, colour management
- `prefsStore`: contentFont, sortOrder, dailyMode, hasSeenWelcome, lastEditedId
- `themeStore`: themeId
- `proStore`: isPro (RevenueCat stub)

### Screens
| Screen | Role | File |
|--------|------|------|
| Home (index.tsx) | Note list + tag chips + Sparky header | app/(tabs)/index.tsx |
| Search | Separate search bar + results | app/(tabs)/search.tsx |
| Tags | Tag CRUD list | app/(tabs)/tags.tsx |
| Settings | Theme, font, sort, export, about | app/(tabs)/settings.tsx |
| Note Editor | Full-screen title + content + tag bar | app/note/[id].tsx |

### Components
- `NoteCard` — list item with accent bar, title, snippet, tags, time
- `NoteEditor` — title TextInput + content TextInput + TagBar slot
- `SearchBar` — debounced text input with clear button
- `FAB` — floating action button
- `ThemeDropdown` — modal theme picker
- `TemplateSheet` — template selection modal
- `ColourPicker`, `ColourChip`, `EmptyState`, `GlassCard`, etc.

## Target Architecture (Streamlined Hybrid)

### From the mockup
```
┌─────────────────────────────────────────────┐
│  [🔍 Search or ⌘K...]          [≡] [⊞]     │  ← Search bar + view toggle
│                                             │
│  (All) 💡Idea  🔧Project  🌙Someday  📅Daily │  ← Category filter tabs
│                                             │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │ API refactor │  │ API refactor plan   │  │
│  │ 2m · #backend│  │                     │  │
│  ├──────────────┤  │ ## Goals            │  │
│  │ Weekly stand │  │ - Move to REST v2   │  │
│  │ 1h · #team   │  │ - Deprecate legacy  │  │
│  ├──────────────┤  │                     │  │
│  │ Extension id │  │ ## Timeline...      │  │
│  │ Yesterday    │  │                     │  │
│  ├──────────────┤  │                     │  │
│  │ + 47 more    │  │                     │  │
│  └──────────────┘  └─────────────────────┘  │
│                                             │
│                                    [+]      │  ← FAB stays
└─────────────────────────────────────────────┘
```

### Key Differences from Current

| Aspect | Current (v1) | Target (Streamlined Hybrid) |
|--------|-------------|----------------------------|
| Navigation | 4 bottom tabs | Single screen, no tab bar |
| Search | Separate tab | Embedded search bar at top |
| Categories | None (tags only) | First-class category filter tabs |
| View mode | List only | List + grid toggle |
| Preview | None | Side-by-side preview pane (wide screens) |
| Tags screen | Dedicated tab | Accessible from note editor/settings |
| Settings | Dedicated tab | Accessible from gear icon or command palette |
| Layout | Single column | Two-pane on wide screens, single on phone |

## Technical Analysis

### 1. Note Categories (New Data)

Need to add a `category` field to `NoteEntry`. Options:

**Option A: Category as a required field**
```ts
type NoteCategory = 'idea' | 'project' | 'someday' | 'daily' | 'uncategorized';
```
- Every note has exactly one category
- "All" tab shows everything, others filter by category
- Migration: existing notes get `'uncategorized'`
- Categories are fixed (not user-defined) — keeps it simple like the mockup

**Option B: Category derived from tags**
- Special tags like `#idea`, `#project` get promoted to categories
- More flexible but muddies the tags/categories distinction
- Users might not understand why some tags appear as tabs

**Recommendation: Option A.** Clean separation. Tags = user-defined labels. Categories = fixed organizational buckets. The category tabs in the mockup are clearly a separate concept from tags.

### 2. Navigation Restructuring

Current: `app/(tabs)/` with 4 tab screens + `app/note/[id].tsx`

Target options:

**Option A: Keep expo-router tabs but hide tab bar**
- Set `tabBarStyle: { display: 'none' }`
- Route to settings/tags via modals or push navigation
- Minimal routing change but hacky

**Option B: Replace tabs with single screen + modals**
- `app/index.tsx` becomes the main screen (list + search + filters + preview)
- `app/note/[id].tsx` stays as push screen for editing
- `app/settings.tsx` as push or modal
- `app/tags.tsx` as push or modal
- Cleaner architecture, matches the design intent

**Recommendation: Option B.** The whole point of the redesign is killing the tab bar. A single main screen with push/modal secondaries is the right structure.

### 3. Two-Pane Layout

The mockup shows list on left, preview on right. On mobile phones this should degrade to list-only with tap-to-open behavior (current behavior).

Implementation approach:
- Use `useWindowDimensions()` to detect width
- Breakpoint: ~600px (iPad portrait) — show two-pane
- Below breakpoint: single column, tap navigates to editor screen
- Above breakpoint: list on left (40%), preview on right (60%)
- Selected note highlighted in list, content shown in preview pane

This is a **Pro feature** candidate or free for all (design decision for Joona).

### 4. Search + Command Palette

The mockup shows `"Search or ⌘K..."` which implies a combined search + command palette.

**Search:** Already works via `filterNotes()` in notesStore. Just need to embed SearchBar in main view instead of separate tab.

**Command palette (⌘K):** Not needed for mobile v1. This is a power-user desktop feature. On mobile, the search bar IS the primary interface. Can add command palette in a future iPad/desktop update.

**For now:** Embed the existing SearchBar at the top of the main screen. The `⌘K` hint can appear as placeholder text but doesn't need a separate keyboard shortcut system on mobile.

### 5. List/Grid View Toggle

The mockup shows two icons in the top-right: list view (≡) and grid view (⊞).

**List view:** Current NoteCard layout (already exists).

**Grid view:** 2-column card grid. Each card shows:
- Title (1 line)
- Snippet preview (2-3 lines)
- First tag as accent
- Time stamp

Implementation:
- Add `viewMode: 'list' | 'grid'` to prefsStore
- `FlatList` with `numColumns={viewMode === 'grid' ? 2 : 1}`
- `NoteCard` needs a `compact` or `grid` variant
- Toggle buttons in header

### 6. Settings and Tags Access

With tabs removed, need alternative access points:

**Settings:** Gear icon in the main screen header (far right), or accessible from a "more" menu. Push navigation to settings screen.

**Tags:** Accessible from:
- Note editor (already has TagBar)
- Settings screen (add a "Manage Tags" section)
- Or a dedicated push screen accessible from gear menu

### 7. Migration Strategy

Existing users with v1 data:
- Notes without `category` field get `'uncategorized'`
- Migration runs in `_layout.tsx` on app load (one-time)
- Tags, content, versions — no changes needed
- prefsStore: add `viewMode` field with default `'list'`

## What Changes and What Stays

### Stays the Same
- All Zustand stores (extend, don't rewrite)
- MMKV storage layer
- NoteEditor component (content editing is identical)
- Theme system (all 4 themes)
- Pro/freemium gating
- FAB component
- Template system
- Version history
- Tag management logic
- All UI components (GlassCard, ColourChip, etc.)

### Changes
- **Delete:** `app/(tabs)/` directory entirely
- **New:** `app/index.tsx` — main single-screen view
- **Move:** Settings → `app/settings.tsx` (push navigation)
- **Move:** Tags → accessible from settings or note editor
- **Modify:** `app/_layout.tsx` — remove Tabs, use Stack only
- **Modify:** `notesStore` — add category filtering
- **Modify:** `prefsStore` — add viewMode, activeCategory
- **New:** `NoteEntry.category` field + migration
- **New:** `CategoryTabs` component
- **New:** `NoteCardGrid` component (grid variant)
- **New:** `ViewToggle` component
- **New:** `NotePreview` component (for two-pane)
- **Modify:** `SearchBar` — embed in main view header
- **Modify:** `NoteCard` — support grid layout variant

## Risks and Edge Cases

1. **Two-pane on small phones:** Must degrade gracefully. Below 600px = single column only.
2. **Category migration:** Users with many notes need seamless migration. Default to 'uncategorized', not destructive.
3. **Losing tag management:** Moving from a dedicated tab to nested access could make tag management harder to find. Mitigation: add "Manage Tags" prominently in settings.
4. **Search performance:** Embedding search in the main view means it runs on every keystroke while the full list is visible. Current debounce (150ms) should handle this.
5. **Grid view performance:** 2-column FlatList with images/previews can be slow. NoteCard is text-only so this should be fine.

## Dependencies

No new npm packages needed. Everything can be built with:
- Existing React Native primitives (FlatList, ScrollView, Pressable)
- `useWindowDimensions()` from react-native (already available)
- Existing Zustand stores (extend)
- Existing theme tokens
- Existing Reanimated (for view transition animations if desired)

## Complexity Estimate

- **Category system + migration:** Low — add field, one-time migration, extend filterNotes
- **Navigation restructuring:** Medium — delete tabs, create single-screen, re-route settings/tags
- **Category filter tabs:** Low — horizontal ScrollView with chips (similar to existing tag chips)
- **List/grid toggle:** Medium — grid layout variant of NoteCard, toggle state
- **Two-pane preview:** Medium-High — responsive layout, split view, selection state
- **Search embedding:** Low — move SearchBar from separate tab to main view header

Total: Medium complexity. The data layer changes are minimal. The work is mostly in layout restructuring.
