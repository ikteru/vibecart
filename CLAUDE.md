# VibeCart Development Ruleset

> **IMPORTANT**: Claude must read and follow these rules at the start of every new conversation and after context compaction.

## Architecture Rules

### Hexagonal/Clean Architecture

```
Domain → Application → Infrastructure → Presentation
```

- **Domain**: Entities, Value Objects, pure business logic (no framework deps)
- **Application**: DTOs, Use Cases, Mappers
- **Infrastructure**: Supabase, Storage, External APIs
- **Presentation**: React components, hooks, pages

### File Structure

```
src/
├── domain/           # Business logic
│   ├── entities/
│   └── value-objects/
├── application/      # Use cases & DTOs
│   ├── dtos/
│   ├── mappers/
│   └── use-cases/
├── infrastructure/   # External services
│   ├── repositories/
│   └── storage/
├── presentation/     # UI layer
│   └── components/
└── i18n/            # Translations
    └── locales/
```

---

## i18n Rules (CRITICAL)

### Default Locale
- **ar-MA (Moroccan Darija)** is the default locale
- All 4 locales must be updated: `en`, `ar`, `ar-MA`, `fr`

### CRITICAL: Add Keys FIRST
When implementing any feature with UI text:
1. **FIRST** add translation keys to ALL 4 locale files
2. **THEN** implement the feature using those keys
3. **NEVER** hardcode strings in components

### Translation Key Pattern
```typescript
// Use nested keys with useTranslations
const t = useTranslations('seller.vibe.chatReviews');
t('title')        // ✓
t('uploadError')  // ✓
```

### Locale Files Location
```
src/i18n/locales/
├── en/common.json
├── ar/common.json
├── ar-MA/common.json
└── fr/common.json
```

### RTL Support
Use logical properties for RTL-compatible layouts:
```typescript
// ✓ RTL-safe
className="ps-4 pe-2 ms-auto me-0 start-0 end-auto"

// ✗ Breaks in RTL
className="pl-4 pr-2 ml-auto mr-0 left-0 right-auto"
```

---

## Component Rules

### Client Components
```typescript
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('namespace');
  // ...
}
```

### Styling Rules (Zinc Dark Theme)
```typescript
// Card styling
"bg-zinc-900 border border-zinc-800 rounded-2xl p-4"

// Input styling
"bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"

// Error state
"bg-red-500/10 border border-red-500/20 text-red-400"

// Success state
"bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"

// Loading state
{isLoading && <Loader2 className="animate-spin" />}
```

### Common Patterns
```typescript
// Toggle switch
<button className={`w-10 h-6 rounded-full transition-colors relative ${
  enabled ? 'bg-emerald-500' : 'bg-zinc-700'
}`}>
  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
    enabled ? 'start-5' : 'start-1'
  }`} />
</button>

// Upload area
<label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
  {/* content */}
</label>
```

---

## Expert Personas

When implementing features, invoke these personas mentally:

### QA Engineer (Most Important)
- Creates verification checklists
- Tests edge cases
- Validates i18n completeness
- Ensures security validation

### CTO/Solutions Architect
- Designs feature architecture
- Ensures clean architecture compliance

### Frontend Engineer
- Component structure
- State management patterns

### i18n Specialist
- Translation quality
- RTL/LTR compatibility

### Security Specialist
- File upload validation
- Input sanitization
- RLS policies

---

## QA Checklist Template

For every feature, verify:

### Functional
- [ ] Primary functionality works
- [ ] Edge cases handled
- [ ] Error states display correctly
- [ ] Loading states show during async ops

### i18n
- [ ] All UI text uses translation keys
- [ ] All 4 locales have translations
- [ ] RTL layout works in ar/ar-MA

### Styling
- [ ] Uses zinc dark theme palette
- [ ] Mobile responsive
- [ ] Consistent with existing components

### Security
- [ ] File type validation (if uploads)
- [ ] File size limits enforced
- [ ] User can only access own data

### Build
- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds
- [ ] No console errors

---

## Naming Conventions

### Files
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Types: `PascalCase.ts`

### Variables
- React components: `PascalCase`
- Functions/hooks: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/interfaces: `PascalCase`

### Translation Keys
- Nested structure: `namespace.section.key`
- Use descriptive names: `seller.vibe.chatReviews.uploadError`

---

## Common Tasks

### Adding a New Feature
1. Add i18n keys to all 4 locales (FIRST!)
2. Create/update domain types if needed
3. Create/update infrastructure services
4. Create presentation components
5. Integrate into existing pages
6. Run QA checklist

### Adding a New Component
1. Create in appropriate folder under `presentation/components/`
2. Use `'use client'` directive if interactive
3. Use `useTranslations` for all text
4. Follow zinc dark theme styling
5. Support RTL with logical properties

### Image Upload Pattern
```typescript
// Use SupabaseStorageService
export type ImageType = 'maker-bio' | 'pinned-review' | 'chat-screenshot';

// Upload via API
const response = await fetch('/api/vibe/upload', {
  method: 'POST',
  body: formData,
});
```

---

## Critical Reminders

1. **Always read this file at conversation start**
2. **i18n keys FIRST, then implementation**
3. **Use zinc dark theme palette**
4. **RTL: use start/end, ps/pe, ms/me**
5. **Run type-check and build before done**
6. **QA checklist for every feature**
