# VibeCart Development Ruleset

> **IMPORTANT**: Claude must read and follow these rules at the start of every new conversation and after context compaction.

---

## Architecture Rules

### Hexagonal/Clean Architecture

```
Domain → Application → Infrastructure → Presentation
```

- **Domain**: Entities, Value Objects, pure business logic (no framework deps)
- **Application**: DTOs, Use Cases, Mappers
- **Infrastructure**: Supabase, Storage, External APIs, Repositories
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
│   ├── auth/         # Supabase auth clients
│   ├── persistence/  # Repositories
│   └── storage/      # File storage
├── presentation/     # UI layer
│   └── components/
└── i18n/            # Translations
    └── locales/
```

### Repository Factory Pattern

```typescript
// Create repositories with a single Supabase client
import { createRepositories } from '@/infrastructure/persistence/supabase';

const repos = createRepositories(supabase);
// repos.productRepository, repos.sellerRepository, etc.
```

### Dependency Flow

```
Server Actions → Use Cases → Repositories → Supabase
       ↓              ↓            ↓
   Validate     Transform    Handle RLS
```

---

## Supabase & RLS Rules (CRITICAL)

### Admin Client Usage

The admin client (service role) bypasses RLS. **ONLY use after verifying authorization in app layer**:

```typescript
// ✓ CORRECT: Verify auth FIRST, then use admin client
const user = await getCurrentUser();
if (!user) {
  return { success: false, error: 'Unauthorized' };
}

// Now safe to use admin client - auth verified
const adminClient = createAdminClient();
const sellerRepo = new SupabaseSellerRepository(supabase, adminClient);
```

```typescript
// ✗ WRONG: Using admin client without auth verification
const adminClient = createAdminClient();
await adminClient.from('sellers').update({...}); // Dangerous!
```

### Repository Pattern with Admin Client

Repositories accept optional admin client for writes:

```typescript
export class SupabaseSellerRepository implements SellerRepository {
  constructor(
    private supabase: SupabaseClient,
    private adminClient?: SupabaseClient  // For RLS bypass after auth verification
  ) {}

  async save(seller: Seller): Promise<void> {
    // Use admin client for updates if available
    const updateClient = this.adminClient || this.supabase;
    await updateClient.from('sellers').update({...});
  }
}
```

### When to Use Admin Client

| Scenario | Use Admin Client? | Reason |
|----------|------------------|--------|
| Server actions (writes) | ✓ Yes | JWT not passed to RLS in server actions |
| Storage uploads | ✓ Yes | Same JWT issue for storage.objects |
| Public/anonymous ops | ✓ Yes | No auth context (e.g., public checkout) |
| Client-side reads | ✗ No | Normal RLS works for authenticated reads |

### Server Action Template

```typescript
async function myServerAction(data: MyDTO) {
  'use server';

  // 1. Verify authentication
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Session expired. Please refresh.' };
  }

  // 2. Create clients
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 3. Create repository with admin client for writes
  const repository = new MyRepository(supabase, adminClient);

  // 4. Execute use case
  try {
    const useCase = new MyUseCase(repository);
    const result = await useCase.execute(data);

    revalidatePath('/my-path');
    return { success: true, data: result };
  } catch (error) {
    console.error('Server action error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
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

## Error Handling Patterns

### Three-Layer Error Handling

```
Server Action → Use Case → Repository
    ↓              ↓           ↓
User-friendly  Business    Technical
  message       errors       errors
```

### Server Actions

```typescript
async function serverAction(data: MyDTO) {
  'use server';

  // 1. Auth check - friendly message
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Session expired. Please refresh.' };
  }

  try {
    // 2. Business logic - propagate error messages
    const result = await useCase.execute(data);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  } catch (error) {
    // 3. Unexpected errors - generic message, log details
    console.error('serverAction error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

### API Routes

```typescript
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validation
    const body = await request.json();
    if (!body.requiredField) {
      return NextResponse.json(
        { success: false, error: 'Missing required field' },
        { status: 400 }
      );
    }

    // Business logic
    const result = await doSomething(body);
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('POST /api/endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### HTTP Status Codes

| Code | Use When |
|------|----------|
| 400 | Validation errors, missing/invalid input |
| 401 | Authentication required (not logged in) |
| 403 | Authorization denied (logged in but not allowed) |
| 404 | Resource not found |
| 500 | Server/unhandled errors |

### Client-Side Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setError(null);

  const result = await serverAction(data);

  if (!result.success) {
    setError(result.error);
    return;
  }

  // Success handling
};
```

---

## Loading State Patterns

### Naming Convention

| Name | Use Case |
|------|----------|
| `isLoading` | Generic loading state |
| `isPending` | `useTransition` pending state |
| `isFetching` | Data fetch operations |
| `isSaving` | Save/submit operations |
| `isConnecting{Service}` | OAuth/external service connections |
| `isUploading` | File upload operations |

### Pattern: useTransition for Server Actions

```typescript
const [isPending, startTransition] = useTransition();

const handleSave = () => {
  startTransition(async () => {
    const result = await saveServerAction(data);
    if (!result.success) {
      setError(result.error);
    }
  });
};

// In JSX
<button disabled={isPending}>
  {isPending ? <Loader2 className="animate-spin" /> : 'Save'}
</button>
```

### Pattern: Optimistic Updates with Revert

```typescript
const [isPending, startTransition] = useTransition();
const [data, setData] = useState(initialData);

const handleToggle = () => {
  const previousData = data;

  // Optimistic update
  setData({ ...data, enabled: !data.enabled });

  startTransition(async () => {
    const result = await toggleServerAction();
    if (!result.success) {
      // Revert on failure
      setData(previousData);
      setError(result.error);
    }
  });
};
```

### Pattern: Individual Loading States

```typescript
const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);

const handleConnectInstagram = async () => {
  setIsConnectingInstagram(true);
  try {
    await connectInstagram();
  } finally {
    setIsConnectingInstagram(false);
  }
};
```

### Pattern: Sync State on Props Change

```typescript
const [config, setConfig] = useState(() => buildConfigFromProps(props));

// Sync when props change (e.g., after server revalidation)
useEffect(() => {
  setConfig(buildConfigFromProps(props));
}, [props]);
```

---

## Validation Patterns

### Value Objects (Domain Layer)

Value objects encapsulate validated, immutable data:

```typescript
// PhoneNumber - validates Moroccan format
const phone = PhoneNumber.create('+212612345678');
if (!phone) throw new Error('Invalid phone number');
phone.format();        // "06 12 34 56 78"
phone.toWhatsAppUrl(); // "https://wa.me/212612345678"

// Money - handles currency arithmetic
const price = Money.create(10000, 'MAD');  // 100.00 MAD
const discounted = price.subtract(Money.create(2000, 'MAD'));
discounted.format();  // "80.00 MAD"

// ProductCategory - validates against allowed values
const category = ProductCategory.create('clothing');
if (!category) throw new Error('Invalid category');
```

### Entity Validation

Entities validate invariants on creation:

```typescript
// Product.create() validates:
// - Title not empty
// - Price > 0
// - Stock >= 0
// - Either videoUrl or instagramMediaId required

const product = Product.create({
  title: '',  // Throws: Title cannot be empty
  price: Money.create(-100, 'MAD'),  // Throws: Price must be positive
});
```

### DTO Validation (Zod)

```typescript
import { z } from 'zod';

const UpdateSellerSchema = z.object({
  shopName: z.string().min(1, 'Shop name required').max(100),
  whatsappNumber: z.string().regex(
    /^(0|\+212|212)[567]\d{8}$/,
    'Invalid Moroccan phone number'
  ),
  shopConfig: z.object({
    vibe: z.object({
      spotlight: z.object({
        enabled: z.boolean(),
        mediaType: z.enum(['image', 'video']),
      }).optional(),
    }).optional(),
  }).optional(),
});

// In server action
const parsed = UpdateSellerSchema.safeParse(data);
if (!parsed.success) {
  return { success: false, error: parsed.error.errors[0].message };
}
```

### Form Validation Pattern

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = (data: FormData): boolean => {
  const newErrors: Record<string, string> = {};

  if (!data.shopName.trim()) {
    newErrors.shopName = t('errors.shopNameRequired');
  }

  if (!isValidPhone(data.whatsappNumber)) {
    newErrors.whatsappNumber = t('errors.invalidPhone');
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

## Security Patterns

### File Upload Validation

```typescript
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  return { valid: true };
}
```

### Storage Path Security

```typescript
// Always prefix storage paths with userId for RLS
const path = `${userId}/${imageType}/${uniqueFilename}`;

// On delete, verify ownership
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  const { path } = await request.json();

  // Security: Verify path belongs to current user
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json(
      { error: 'Unauthorized to delete this file' },
      { status: 403 }
    );
  }

  await storageService.deleteImage(path);
}
```

### Token Encryption

```typescript
// Always encrypt sensitive tokens before storage
import { encryptToken, decryptToken } from '@/infrastructure/utils/encryption';

// Storing
const encryptedAccessToken = encryptToken(accessToken);
await tokenRepo.save({
  ...tokenData,
  accessToken: encryptedAccessToken,
});

// Retrieving
const token = await tokenRepo.findByUserId(userId);
const decryptedAccessToken = decryptToken(token.accessToken);
```

### Authorization Checks

```typescript
// In server actions - verify ownership
async function updateProduct(productId: string, data: UpdateProductDTO) {
  'use server';

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify user owns this product
  const product = await productRepo.findById(productId);
  if (!product || product.sellerId !== user.sellerId) {
    return { success: false, error: 'Product not found' };
  }

  // Safe to proceed with update
}
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
"bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"

// Button - Primary
"px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"

// Button - Secondary
"px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"

// Error state
"bg-red-500/10 border border-red-500/20 text-red-400"

// Success state
"bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
```

### Error Display Components

```typescript
// Inline error message
{error && (
  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
    <AlertCircle size={16} />
    <span>{error}</span>
  </div>
)}

// Dismissible alert
{message && (
  <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
    message.type === 'success'
      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
      : 'bg-red-500/10 border border-red-500/20 text-red-400'
  }`}>
    {message.type === 'success'
      ? <CheckCircle size={14} />
      : <AlertCircle size={14} />
    }
    <span>{message.text}</span>
    <button onClick={() => setMessage(null)} className="ms-auto hover:opacity-70">
      <X size={14} />
    </button>
  </div>
)}
```

### Common Patterns
```typescript
// Toggle switch (RTL-safe)
<button
  onClick={() => setEnabled(!enabled)}
  className={`w-10 h-6 rounded-full transition-colors relative ${
    enabled ? 'bg-emerald-500' : 'bg-zinc-700'
  }`}
>
  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
    enabled ? 'start-5' : 'start-1'
  }`} />
</button>

// Upload area
<label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
  <Upload size={24} className="text-zinc-500 mb-2" />
  <span className="text-sm text-zinc-400">{t('uploadPrompt')}</span>
  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
</label>

// Loading button
<button disabled={isPending} className="...">
  {isPending ? (
    <Loader2 size={16} className="animate-spin" />
  ) : (
    t('save')
  )}
</button>
```

---

## DTO & Mapper Patterns

### DTO Types

| Type | Purpose | Example |
|------|---------|---------|
| `CreateXxxDTO` | Input for creation | `CreateProductDTO` |
| `UpdateXxxDTO` | Input for updates | `UpdateSellerDTO` |
| `XxxResponseDTO` | Output with computed properties | `ProductResponseDTO` |
| `XxxListQueryDTO` | Filters and pagination | `ProductListQueryDTO` |

### Mapper Pattern

```typescript
// ProductMapper transforms between domain and DTOs
export class ProductMapper {
  static toDTO(product: Product): ProductResponseDTO {
    return {
      id: product.id,
      title: product.title,
      price: product.price.toJSON(),
      discountPrice: product.discountPrice?.toJSON(),
      // Computed properties
      hasDiscount: product.discountPrice !== undefined,
      discountPercentage: this.calculateDiscount(product),
      effectivePrice: product.discountPrice || product.price,
      isInStock: product.stock > 0,
    };
  }

  static toDomain(row: ProductRow): Product {
    return Product.create({
      id: row.id,
      title: row.title,
      price: Money.create(row.price_amount, row.price_currency),
      // ...
    });
  }
}
```

### Response DTO Pattern

```typescript
// Include computed/derived properties in response DTOs
interface ProductResponseDTO {
  // Direct properties
  id: string;
  title: string;
  price: MoneyDTO;

  // Computed properties (calculated by mapper)
  hasDiscount: boolean;
  discountPercentage: number | null;
  effectivePrice: MoneyDTO;
  isInStock: boolean;
  isNew: boolean;  // created within last 7 days
}
```

---

## Testing Patterns

### Test Factories

```typescript
// Use factories for consistent test data
import { ProductFactory } from '@/test/factories/ProductFactory';

// Default product
const product = ProductFactory.create();

// With specific attributes
const discounted = ProductFactory.create({
  discountPrice: Money.create(8000, 'MAD'),
});

// With presets
const outOfStock = ProductFactory.outOfStock();
const featured = ProductFactory.featured();
```

### Mock Repositories

```typescript
// Use mock repos for isolated testing
import { MockProductRepository } from '@/test/mocks/MockProductRepository';

describe('GetProducts use case', () => {
  it('returns products for seller', async () => {
    const mockRepo = new MockProductRepository();
    mockRepo.seedWith([product1, product2]);

    const useCase = new GetProducts(mockRepo);
    const result = await useCase.execute({ sellerId: 'seller-1' });

    expect(result.products).toHaveLength(2);
  });
});
```

### Test Commands

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
npm run test -- -t "pattern"  # Filter by test name
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
- Reviews RLS and security patterns

### Frontend Engineer
- Component structure
- State management patterns
- Loading and error states

### i18n Specialist
- Translation quality
- RTL/LTR compatibility

### Security Specialist
- File upload validation
- Input sanitization
- RLS policies
- Token encryption

---

## QA Checklist Template

For every feature, verify:

### Functional
- [ ] Primary functionality works
- [ ] Edge cases handled
- [ ] Error states display correctly with user-friendly messages
- [ ] Loading states show during ALL async operations

### Authentication & Authorization
- [ ] Auth verified before admin client usage
- [ ] User can only access/modify their own data
- [ ] Unauthorized access returns appropriate error

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
- [ ] Storage paths prefixed with userId
- [ ] Tokens encrypted before storage

### State Management
- [ ] State syncs when props change (useEffect)
- [ ] Optimistic updates revert on failure
- [ ] No stale state after server actions

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
4. Create server actions with proper error handling
5. Create presentation components with loading/error states
6. Run QA checklist

### Adding a Server Action
```typescript
async function myAction(data: MyDTO) {
  'use server';

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Session expired' };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();  // For writes

  try {
    // Business logic
    revalidatePath('/path');
    return { success: true };
  } catch (error) {
    console.error('myAction error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

### Adding a New Component
1. Create in appropriate folder under `presentation/components/`
2. Use `'use client'` directive if interactive
3. Use `useTranslations` for all text
4. Follow zinc dark theme styling
5. Support RTL with logical properties (start/end, ps/pe)
6. Handle loading and error states

### Image Upload Pattern
```typescript
// Use SupabaseStorageService with admin client
export type ImageType = 'maker-bio' | 'pinned-review' | 'chat-screenshot';

// Upload via API
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'maker-bio');

const response = await fetch('/api/vibe/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
if (!result.success) {
  setError(result.error);
}
```

---

## Critical Reminders

1. **Always read this file at conversation start**
2. **i18n keys FIRST, then implementation**
3. **Admin client ONLY after auth verification**
4. **Use zinc dark theme palette**
5. **RTL: use start/end, ps/pe, ms/me**
6. **Every async operation needs loading state**
7. **User-friendly error messages (not technical)**
8. **Sync state with useEffect when props change**
9. **Run type-check and build before done**
10. **QA checklist for every feature**
