export type UserRole = "admin" | "user";

export type Profile = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  department_id: string | null;
  role: UserRole;
};

export type Department = {
  id: string;
  name: string;
  code: string | null;
  deleted_at?: string | null;
};

export type ItemGroup = {
  id: string;
  code?: string | null;
  name: string;
  sort_order: number;
  deleted_at?: string | null;
};

export type ItemSubgroup = {
  id: string;
  group_id: string;
  code?: string | null;
  name: string;
  sort_order: number;
  deleted_at?: string | null;
  item_groups?: { name: string } | null;
};

export type Item = {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
  barcode: string;
  subgroup_id: string;
  deleted_at?: string | null;
  item_subgroups?: ItemSubgroup | null;
};

export type DepartmentItem = {
  id: string;
  department_id: string;
  item_id: string;
  added_at: string;
  deleted_at?: string | null;
  items?: Item | null;
};

export type ItemWithDepartments = Item & {
  department_ids?: string[];
};

export type ScanLog = {
  id: string;
  department_id: string;
  item_id: string;
  user_id: string;
  scanned_barcode: string;
  scanned_at: string;
  scan_source?: "scanner" | "manual_confirm";
  items?: Item | null;
  profiles?: { username: string; full_name: string | null } | null;
  departments?: Department | null;
};

export type FavoriteItem = {
  id: string;
  item_id: string;
  sort_order: number;
  items: Item;
};

export type PrescanStatus = "pending" | "scanned" | "cancelled";

export type PrescanItem = {
  id: string;
  department_id: string;
  item_id: string;
  qty: number;
  status: PrescanStatus;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
  scanned_by?: string | null;
  scanned_at?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  item?: Item | null;
  created_by_profile?: { username: string; full_name: string | null } | null;
  scanned_by_profile?: { username: string; full_name: string | null } | null;
  departments?: { name: string } | null;
};

export type AuditLog = {
  id: string;
  actor_id: string | null;
  department_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor_profile?: { username: string; full_name: string | null } | null;
  departments?: { name: string } | null;
};
