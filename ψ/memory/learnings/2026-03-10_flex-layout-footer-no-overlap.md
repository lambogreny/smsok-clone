# Lesson: Flex Layout Prevents Footer Overlap in Dashboard Shells

**Date**: 2026-03-10
**Context**: DashboardShell footer was inside `<main className="flex-1 overflow-auto">`, causing it to overlap content on data-heavy pages

## Pattern
For dashboard layouts with sidebar + main + footer, use flex column layout on the main container:

```tsx
<main className="flex-1 overflow-auto flex flex-col">
  <header className="sticky top-0">...</header>
  <div className="flex-1">
    {children}  {/* page content fills available space */}
  </div>
  <footer className="shrink-0">...</footer>  {/* never overlaps */}
</main>
```

Key classes:
- `flex flex-col` on scrollable main — stack children vertically
- `flex-1` on content wrapper — grow to push footer down
- `shrink-0` on footer — prevent compression
- `sticky top-0` on header — stays visible while scrolling

## Anti-pattern
Putting footer as a plain sibling inside `overflow-auto` without flex structure. The footer scrolls with content and can overlap the last items when content is shorter than viewport.

## When to apply
Any dashboard shell, admin panel, or app layout with a persistent footer. Set this up during initial shell construction, not after building pages on top of it.
