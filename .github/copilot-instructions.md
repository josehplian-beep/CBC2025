# CBC Church Management System - AI Agent Instructions

## Project Overview
A React + TypeScript church management platform built with Vite, Supabase (PostgreSQL), and shadcn/ui components. Manages members, events, staff, media albums, testimonials, departments, and a church school system with teachers/students/classes.

## Tech Stack & Architecture
- **Frontend**: React 18, TypeScript, Vite, React Router v6, TanStack Query, shadcn/ui (Radix UI)
- **Backend**: Supabase (PostgreSQL database, Auth, Storage, Edge Functions)
- **Styling**: Tailwind CSS with custom theme variables, fonts: Outfit (sans), Montserrat (display)
- **Build**: `npm run dev` (port 8080), `npm run build`, `npm run preview`

## Key Patterns & Conventions

### Import Aliases
Always use `@/` path alias for internal imports:
```typescript
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
```

### Database Access
- **Direct Supabase client**: `import { supabase } from "@/integrations/supabase/client"`
- **No custom query hooks**: Query Supabase directly using `.from()`, `.select()`, `.insert()`, etc.
- **Types**: Auto-generated in `src/integrations/supabase/types.ts` - use for type safety

Example pattern:
```typescript
const { data: members, error } = await supabase
  .from("members")
  .select("id, name, email, family_id")
  .order("name");
```

### Authentication & Authorization

#### Role System
Five active roles defined in `src/lib/permissions.ts`:
- `member` - Basic access
- `editor` - Content management (albums, events, testimonies, departments)
- `teacher` - School system access (students, classes, attendance)
- `staff` - Member/department management
- `administrator` - Full system access including user/role management

**Legacy roles**: `admin`, `viewer` (deprecated, map to `administrator` and `member`)

#### Permission Checking
```typescript
import { usePermissions } from "@/hooks/usePermissions";

const { can, canAny, role, isAdministrator } = usePermissions();

if (can('manage_albums')) { /* ... */ }
if (canAny(['manage_students', 'take_attendance'])) { /* ... */ }
```

#### Route Protection
Wrap protected routes with `<ProtectedRoute>`:
```typescript
<Route path="/admin/albums" element={
  <ProtectedRoute permission="manage_albums">
    <AdminLayout><AdminAlbums /></AdminLayout>
  </ProtectedRoute>
} />
```

Use `requireAll={true}` to require multiple permissions.

### UI Components (shadcn/ui)
- All UI components live in `src/components/ui/`
- Use composition patterns: `<Card><CardHeader><CardTitle>...</>`
- Common imports: `Button`, `Input`, `Dialog`, `Select`, `Table`, `Badge`, `Tabs`, `Form`
- Styling: Use `cn()` utility from `@/lib/utils` for conditional classes

### Layout System
- **Public pages**: Use `<Navigation>` component (see `src/pages/Index.tsx`)
- **Admin pages**: Wrap in `<AdminLayout>` which provides sidebar + auth check
- **School pages**: `TeacherDashboard` has custom layout for teacher-specific features

### Database Schema (Key Tables)

**Core Entities:**
- `members` - Church members with family relationships (`family_id` FK)
- `families` - Address/location data, one-to-many with members
- `staff_biographies` - Staff profiles with slug-based URLs
- `department_members` - Department leadership/members (no FK to members table)
- `events` - Calendar events with recurring patterns support
- `albums` + `photos` - Media galleries with storage bucket integration
- `testimonials` - Published messages/sermons

**School System:**
- `teachers` - Teacher profiles with bio/photo
- `students` - Student records with guardian info
- `classes` - Class definitions with teacher assignment
- `student_classes` - Many-to-many student-class enrollment
- `attendance_records` - Daily attendance tracking

**System:**
- `user_roles` - Maps auth users to app roles (enum: `app_role`)
- Storage buckets: `albums`, `member-profiles`, `staff-profiles`

### Supabase Edge Functions
Located in `supabase/functions/`:
- `birthday-reminder` - Email automation for member birthdays (Resend integration)
- `admin-users` - User management utilities
- `youtube-search` - Media integration

Run migrations via Supabase Dashboard SQL editor (see `RUN_THIS_IN_SUPABASE.sql` for admin setup examples).

### Common Development Workflows

#### Adding a New Admin Page
1. Create page in `src/pages/Admin*.tsx`
2. Add permission check to `src/lib/permissions.ts` if needed
3. Register route in `src/App.tsx` with `<ProtectedRoute>`
4. Add sidebar link in `src/components/AdminSidebar.tsx`

#### Working with Forms
Use `react-hook-form` + `zod` + shadcn Form components:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

const schema = z.object({ name: z.string().min(1) });
const form = useForm({ resolver: zodResolver(schema) });
```

#### Image Upload Pattern
```typescript
const { data, error } = await supabase.storage
  .from("bucket-name")
  .upload(`path/${file.name}`, file);

const { data: { publicUrl } } = supabase.storage
  .from("bucket-name")
  .getPublicUrl(data.path);
```

### TypeScript Configuration
- `strictNullChecks: false` - nulls allowed without explicit handling
- `noImplicitAny: false` - implicit any permitted
- Path aliases configured in `tsconfig.json` and `vite.config.ts`

### Important Notes
- Development built via Lovable platform (see README for project URL)
- Dev server runs on port 8080 (configured in `vite.config.ts`)
- Theme system uses next-themes with light/dark mode support
- RLS policies enforced at database level - check migrations for policy patterns
- Component tagging enabled in dev mode via `lovable-tagger` plugin

### Testing & Debugging
- Check `src/pages/AdminDashboard.tsx` for permission-based feature flag patterns
- Use browser DevTools + React DevTools
- Supabase logs available in dashboard for Edge Function debugging
- RLS policy violations appear as 403/empty responses - check `user_roles` table

### File Organization
- **Pages**: `src/pages/` - one file per route
- **Components**: `src/components/` - shared + UI components
- **Hooks**: `src/hooks/` - custom React hooks
- **Utils**: `src/lib/` - utilities and config
- **Types**: Auto-generated in `src/integrations/supabase/types.ts` (don't edit manually)
