# Lesson: TypeScript `as const` + useState literal type trap

**Date**: 2026-03-10
**Repo**: smsok-clone
**Symptom**: Build error — `Type 'string' is not assignable to type 'SetStateAction<"#10B981">'`

## What Happened

```ts
const COLORS = [
  { hex: "#10B981", ... },
  ...
] as const;

// This infers useState<"#10B981"> — literal type, not string
const [color, setColor] = useState(COLORS[0].hex);

// ColorPicker passes string → type error
<ColorPicker onChange={setColor} />
```

## Fix

```ts
const [color, setColor] = useState<string>(COLORS[0].hex);
```

## Rule

When initializing `useState` from a value in an `as const` array/object, **always annotate the type explicitly** if the state needs to accept broader values later:
- `useState<string>(...)` not `useState(...)`
- `useState<number>(...)` not `useState(...)`

## Context

Applies any time a const-typed literal is used as useState initial value but the setter will receive a broader type (e.g. from a callback/picker component).
