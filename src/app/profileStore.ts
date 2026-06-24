import { useSyncExternalStore } from "react";

export type ProfileType = "master" | "gerente" | "visitante";

export interface PermissionSet {
  // Módulos visíveis
  viewDashboard: boolean;
  viewClaims: boolean;
  viewHistory: boolean;
  viewStoreDirectory: boolean;
  viewOperacional: boolean;
  viewRecords: boolean;
  viewConformity: boolean;
  viewReports: boolean;
  // Ações em Ocorrências
  createRecords: boolean;
  editRecords: boolean;
  deleteRecords: boolean;
  // Ações em Sinistros
  createClaims: boolean;
  // Administração
  managePermissions: boolean;
}

export interface CustomProfile {
  id: string;
  name: string;
  color: string;
  permissions: PermissionSet;
  createdAt: string;
}

export interface AppUser {
  id: string;
  nome: string;
  email: string;
  password: string;
  cargo: string;
  initials: string;
  profile: ProfileType;
  customProfileId?: string;
}

// ─── Default permission sets ──────────────────────────────────────────────────

export const BUILTIN_PERMISSIONS: Record<ProfileType, PermissionSet> = {
  master: {
    viewDashboard: true, viewClaims: true, viewHistory: true,
    viewStoreDirectory: true, viewOperacional: true, viewRecords: true,
    viewConformity: true, viewReports: true,
    createRecords: true, editRecords: true, deleteRecords: true,
    createClaims: true, managePermissions: true,
  },
  gerente: {
    viewDashboard: true, viewClaims: true, viewHistory: true,
    viewStoreDirectory: true, viewOperacional: true, viewRecords: true,
    viewConformity: true, viewReports: true,
    createRecords: true, editRecords: true, deleteRecords: true,
    createClaims: true, managePermissions: false,
  },
  visitante: {
    viewDashboard: true, viewClaims: true, viewHistory: true,
    viewStoreDirectory: true, viewOperacional: true, viewRecords: true,
    viewConformity: true, viewReports: true,
    createRecords: false, editRecords: false, deleteRecords: false,
    createClaims: false, managePermissions: false,
  },
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

const USERS_KEY = "jp_mall_users";
const SESSION_KEY = "jp_mall_session";
const CUSTOM_PROFILES_KEY = "jp_mall_custom_profiles";

// ─── Default users ────────────────────────────────────────────────────────────

const DEFAULT_USERS: AppUser[] = [
  { id: "1", nome: "Administrador", email: "master@jpmall.com.br", password: "master123", cargo: "Master", initials: "MA", profile: "master" },
  { id: "2", nome: "Gerência", email: "gerencia@jpmall.com.br", password: "gerente123", cargo: "Gerente Operacional", initials: "GR", profile: "gerente" },
  { id: "3", nome: "Carlos Silva", email: "carlos.silva@jpmall.com.br", password: "carlos123", cargo: "Gerente de Área", initials: "CS", profile: "gerente" },
  { id: "4", nome: "Ana Souza", email: "ana.souza@jpmall.com.br", password: "ana123", cargo: "Coordenadora Operacional", initials: "AS", profile: "gerente" },
];

// ─── Loaders ──────────────────────────────────────────────────────────────────

function loadUsers(): AppUser[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_USERS;
  } catch { return DEFAULT_USERS; }
}

function loadSession(): AppUser | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function loadCustomProfiles(): CustomProfile[] {
  try {
    const stored = localStorage.getItem(CUSTOM_PROFILES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

// ─── State ────────────────────────────────────────────────────────────────────

let users: AppUser[] = loadUsers();
let currentUser: AppUser | null = loadSession();
let customProfiles: CustomProfile[] = loadCustomProfiles();

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ─── Current user / session ───────────────────────────────────────────────────

export function getCurrentUser(): AppUser | null { return currentUser; }
export function useCurrentUser(): AppUser | null {
  return useSyncExternalStore(subscribe, getCurrentUser);
}

export function getProfile(): ProfileType { return currentUser?.profile ?? "visitante"; }
export function useProfile(): ProfileType {
  return useSyncExternalStore(subscribe, getProfile);
}

// ─── Effective permissions ────────────────────────────────────────────────────

export function getEffectivePermissions(user: AppUser): PermissionSet {
  if (user.customProfileId) {
    const custom = customProfiles.find((p) => p.id === user.customProfileId);
    if (custom) return custom.permissions;
  }
  return BUILTIN_PERMISSIONS[user.profile] ?? BUILTIN_PERMISSIONS.visitante;
}

export function getCurrentPermissions(): PermissionSet {
  if (!currentUser) return BUILTIN_PERMISSIONS.visitante;
  return getEffectivePermissions(currentUser);
}

export function useCurrentPermissions(): PermissionSet {
  return useSyncExternalStore(subscribe, getCurrentPermissions);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function login(email: string, password: string): { ok: boolean; error?: string } {
  const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
  if (!u) return { ok: false, error: "E-mail ou senha incorretos." };
  currentUser = u;
  localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  emit();
  return { ok: true };
}

export function logout() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  emit();
}

export function register(nome: string, email: string, password: string): { ok: boolean; error?: string } {
  if (users.find((x) => x.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "Este e-mail já está cadastrado." };
  }
  const initials = nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const newUser: AppUser = {
    id: String(Date.now()), nome: nome.trim(),
    email: email.trim().toLowerCase(), password,
    cargo: "Visitante", initials, profile: "visitante",
  };
  users = [...users, newUser];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  currentUser = newUser;
  localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  emit();
  return { ok: true };
}

// ─── Users management ─────────────────────────────────────────────────────────

export function getUsers(): AppUser[] { return users; }
export function useUsers(): AppUser[] {
  return useSyncExternalStore(subscribe, getUsers);
}

export function updateUserProfile(id: string, newProfile: ProfileType) {
  users = users.map((u) => u.id === id ? { ...u, profile: newProfile, customProfileId: undefined } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  if (currentUser?.id === id) {
    currentUser = { ...currentUser, profile: newProfile, customProfileId: undefined };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  }
  emit();
}

export function updateUserDetails(id: string, updates: { nome?: string; cargo?: string; email?: string; telefone?: string }) {
  users = users.map((u) => u.id === id ? { ...u, ...updates } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  if (currentUser?.id === id) {
    currentUser = { ...currentUser, ...updates };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  }
  emit();
}

export function assignCustomProfile(userId: string, customProfileId: string | null) {
  users = users.map((u) =>
    u.id === userId
      ? { ...u, customProfileId: customProfileId ?? undefined }
      : u
  );
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  if (currentUser?.id === userId) {
    currentUser = { ...currentUser, customProfileId: customProfileId ?? undefined };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  }
  emit();
}

// ─── Custom profiles CRUD ─────────────────────────────────────────────────────

export function getCustomProfiles(): CustomProfile[] { return customProfiles; }
export function useCustomProfiles(): CustomProfile[] {
  return useSyncExternalStore(subscribe, getCustomProfiles);
}

export function createCustomProfile(name: string, color: string, permissions: PermissionSet): CustomProfile {
  const profile: CustomProfile = {
    id: `cp_${Date.now()}`, name, color, permissions,
    createdAt: new Date().toISOString(),
  };
  customProfiles = [...customProfiles, profile];
  localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(customProfiles));
  emit();
  return profile;
}

export function updateCustomProfile(id: string, updates: { name?: string; color?: string; permissions?: PermissionSet }) {
  customProfiles = customProfiles.map((p) => p.id === id ? { ...p, ...updates } : p);
  localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(customProfiles));
  emit();
}

export function deleteCustomProfile(id: string) {
  customProfiles = customProfiles.filter((p) => p.id !== id);
  // Unassign from any users that had this profile
  users = users.map((u) => u.customProfileId === id ? { ...u, customProfileId: undefined } : u);
  localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(customProfiles));
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  if (currentUser?.customProfileId === id) {
    currentUser = { ...currentUser, customProfileId: undefined };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  }
  emit();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isMaster(): boolean { return getProfile() === "master"; }
export function isVisitante(): boolean { return getProfile() === "visitante"; }
