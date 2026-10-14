// Role-based permissions configuration
export type UserRole = 'member' | 'author' | 'editor' | 'teacher' | 'staff' | 'administrator' | 'admin' | 'viewer';

export type Permission =
  | 'view_public_content'
  | 'view_member_directory'
  | 'manage_albums'
  | 'manage_events'
  | 'manage_testimonies'
  | 'write_posts'
  | 'manage_students'
  | 'manage_classes'
  | 'take_attendance'
  | 'manage_members'
  | 'manage_departments'
  | 'manage_staff'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_prayer_requests'
  | 'manage_page_content'
  | 'view_admin_panel';

export const RolePermissions: Record<UserRole, Permission[]> = {
  member: [
    'view_public_content',
    'view_member_directory'
  ],
  // Authors only write Testimonies and Rooted Thoughts posts
  author: [
    'view_public_content',
    'write_posts'
  ],
  editor: [
    'view_public_content',
    'view_admin_panel',
    'view_member_directory',
    'manage_albums',
    'manage_events',
    'manage_testimonies',
    'write_posts',
    'manage_members',
    'manage_staff',
    'manage_departments',
    'manage_page_content'
  ],
  teacher: [
    'view_public_content',
    'view_admin_panel',
    'view_member_directory',
    'manage_students',
    'manage_classes',
    'take_attendance'
  ],
  staff: [
    'view_public_content',
    'view_admin_panel',
    'view_member_directory',
    'manage_members',
    'manage_departments',
    'manage_staff',
    'manage_prayer_requests'
  ],
  administrator: [
    'view_public_content',
    'view_admin_panel',
    'view_member_directory',
    'manage_albums',
    'manage_events',
    'manage_testimonies',
    'write_posts',
    'manage_students',
    'manage_classes',
    'take_attendance',
    'manage_members',
    'manage_departments',
    'manage_staff',
    'manage_users',
    'manage_roles',
    'manage_prayer_requests',
    'manage_page_content'
  ],
  // Legacy role mappings (kept for type compatibility, not assigned anymore)
  admin: [
    'view_public_content',
    'view_admin_panel',
    'view_member_directory',
    'manage_albums',
    'manage_events',
    'manage_testimonies',
    'write_posts',
    'manage_students',
    'manage_classes',
    'take_attendance',
    'manage_members',
    'manage_departments',
    'manage_staff',
    'manage_users',
    'manage_roles',
    'manage_prayer_requests',
    'manage_page_content'
  ],
  viewer: [
    'view_public_content'
  ]
};

export function hasPermission(userRole: UserRole | null, permission: Permission): boolean {
  if (!userRole) return false;
  return RolePermissions[userRole]?.includes(permission) ?? false;
}

export function hasAnyPermission(userRole: UserRole | null, permissions: Permission[]): boolean {
  if (!userRole) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    member: 'Member',
    author: 'Author',
    editor: 'Editor',
    teacher: 'Teacher',
    staff: 'Staff',
    administrator: 'Administrator',
    admin: 'Administrator', // Legacy
    viewer: 'Viewer' // Legacy
  };
  return displayNames[role] || role;
}

export const ALL_ROLES: UserRole[] = ['member', 'author', 'editor', 'teacher', 'staff', 'administrator'];
