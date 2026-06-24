import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  X, User, Bell, Shield, ShieldCheck, Crown, UserCheck, Eye,
  Building2, Camera, ChevronRight, Plus, Pencil, Trash2,
  ChevronLeft, LayoutGrid, Check,
} from "lucide-react";
import {
  useProfile, useUsers, useCurrentUser,
  updateUserProfile, updateUserDetails, assignCustomProfile,
  useCustomProfiles, createCustomProfile, updateCustomProfile, deleteCustomProfile,
  ProfileType, PermissionSet, CustomProfile, BUILTIN_PERMISSIONS,
} from "../profileStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "perfil" | "notificacoes" | "seguranca" | "permissoes";
type EditorState =
  | null
  | { mode: "create" }
  | { mode: "edit"; profile: CustomProfile };

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFILE_META: Record<ProfileType, { label: string; icon: typeof Crown; badge: string; border: string; bg: string; text: string }> = {
  master:   { label: "Master",   icon: Crown,      badge: "bg-amber-100 text-amber-700", border: "border-amber-400",  bg: "bg-amber-50",  text: "text-amber-800" },
  gerente:  { label: "Gerente",  icon: UserCheck,  badge: "bg-blue-100 text-blue-700",   border: "border-blue-400",   bg: "bg-blue-50",   text: "text-blue-800"  },
  visitante:{ label: "Visitante",icon: Eye,         badge: "bg-gray-100 text-gray-600",  border: "border-gray-300",   bg: "bg-gray-50",   text: "text-gray-600"  },
};

const PRESET_COLORS = [
  "#8B1A1A", "#1B3A6B", "#065f46", "#4f46e5",
  "#7A3A00", "#374151", "#be185d", "#0369a1",
];

const PERMISSION_GROUPS: { label: string; desc?: string; items: { key: keyof PermissionSet; label: string; desc?: string }[] }[] = [
  {
    label: "Módulos visíveis",
    desc: "Quais seções aparecem no menu lateral",
    items: [
      { key: "viewDashboard",      label: "Dashboard" },
      { key: "viewClaims",         label: "Novo Sinistro" },
      { key: "viewHistory",        label: "Histórico" },
      { key: "viewStoreDirectory", label: "Diretório de Lojas" },
      { key: "viewOperacional",    label: "Gestão Operacional" },
      { key: "viewRecords",        label: "Ocorrências (sub-módulo)", desc: "Exige Gestão Operacional" },
      { key: "viewConformity",     label: "Conformidade (sub-módulo)", desc: "Exige Gestão Operacional" },
      { key: "viewReports",        label: "Relatórios" },
    ],
  },
  {
    label: "Ações em Ocorrências",
    items: [
      { key: "createRecords", label: "Criar registros" },
      { key: "editRecords",   label: "Editar registros" },
      { key: "deleteRecords", label: "Excluir registros" },
    ],
  },
  {
    label: "Ações em Sinistros",
    items: [
      { key: "createClaims", label: "Criar sinistros" },
    ],
  },
  {
    label: "Administração",
    items: [
      { key: "managePermissions", label: "Gerenciar permissões", desc: "Acesso à aba Permissões" },
    ],
  },
];

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] focus:ring-offset-1 ${checked ? "bg-[#8B1A1A]" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

// ─── Profile Editor ───────────────────────────────────────────────────────────

function ProfileEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CustomProfile;
  onSave: (name: string, color: string, perms: PermissionSet) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);
  const [perms, setPerms] = useState<PermissionSet>(
    initial?.permissions ?? { ...BUILTIN_PERMISSIONS.visitante }
  );
  const [nameError, setNameError] = useState("");

  function applyPreset(preset: ProfileType) {
    setPerms({ ...BUILTIN_PERMISSIONS[preset] });
  }

  function toggle(key: keyof PermissionSet) {
    setPerms((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleSave() {
    if (!name.trim()) { setNameError("Nome obrigatório"); return; }
    onSave(name.trim(), color, perms);
  }

  const enabledCount = Object.values(perms).filter(Boolean).length;
  const total = Object.keys(perms).length;

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-bold text-gray-900">
          {initial ? "Editar Perfil" : "Criar Perfil"}
        </h3>
        <span className="ml-auto text-[11px] text-gray-400">{enabledCount}/{total} permissões</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* Name */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Nome do perfil</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(""); }}
            placeholder="Ex: Fiscal, Coordenador..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] ${nameError ? "border-red-400" : "border-gray-200"}`}
          />
          {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
        </div>

        {/* Color */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cor do perfil</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
                style={{ backgroundColor: c, borderColor: color === c ? "#111" : "transparent" }}
              >
                {color === c && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Começar de um modelo</label>
          <div className="flex gap-2">
            {(["master", "gerente", "visitante"] as ProfileType[]).map((p) => {
              const m = PROFILE_META[p];
              const Icon = m.icon;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${m.border} ${m.bg} ${m.text} hover:opacity-80`}
                >
                  <Icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Permission groups */}
        <div className="space-y-4">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">{group.label}</p>
                {group.desc && <p className="text-[10px] text-gray-400 mt-0.5">{group.desc}</p>}
              </div>
              <div className="divide-y divide-gray-50">
                {group.items.map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-800 font-medium">{label}</p>
                      {desc && <p className="text-[11px] text-gray-400">{desc}</p>}
                    </div>
                    <Toggle checked={perms[key]} onChange={() => toggle(key)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="pt-4 border-t border-gray-100 mt-4 flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {initial ? "Salvar alterações" : "Criar perfil"}
        </button>
      </div>
    </div>
  );
}

// ─── User profile selector ────────────────────────────────────────────────────

function UserProfileSelector({ user, customProfiles }: { user: ReturnType<typeof useUsers>[0]; customProfiles: CustomProfile[] }) {
  const currentUser = useCurrentUser();
  const isMe = currentUser?.id === user.id;

  // Current assignment value: "builtin:master" | "builtin:gerente" | "builtin:visitante" | "custom:cp_xxx"
  const currentValue = user.customProfileId ? `custom:${user.customProfileId}` : `builtin:${user.profile}`;

  function handleChange(value: string) {
    if (value.startsWith("builtin:")) {
      const profile = value.replace("builtin:", "") as ProfileType;
      updateUserProfile(user.id, profile);
    } else {
      const customId = value.replace("custom:", "");
      assignCustomProfile(user.id, customId);
    }
  }

  // Active display
  const activeCustom = user.customProfileId ? customProfiles.find((p) => p.id === user.customProfileId) : null;
  const m = PROFILE_META[user.profile];

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-[#C8A882] text-[#8B1A1A] font-bold flex items-center justify-center text-sm shrink-0">
        {user.initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-gray-900 truncate">{user.nome}</p>
          {isMe && <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#8B1A1A] shrink-0">Você</span>}
        </div>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>

      {/* Selector */}
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
        {/* Active badge */}
        {activeCustom ? (
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: activeCustom.color }}
          >
            {activeCustom.name}
          </span>
        ) : (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${m.border} ${m.bg} ${m.text}`}>
            {m.label}
          </span>
        )}

        {/* Dropdown */}
        <select
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none text-[11px] font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer"
        >
          <optgroup label="Perfis padrão">
            <option value="builtin:master">Master</option>
            <option value="builtin:gerente">Gerente</option>
            <option value="builtin:visitante">Visitante</option>
          </optgroup>
          {customProfiles.length > 0 && (
            <optgroup label="Perfis personalizados">
              {customProfiles.map((p) => (
                <option key={p.id} value={`custom:${p.id}`}>{p.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const currentProfile = useProfile();
  const currentUser = useCurrentUser();
  const users = useUsers();
  const customProfiles = useCustomProfiles();
  const isMaster = currentProfile === "master";

  const PROFILE_DEFAULTS: Record<ProfileType, { nome: string; cargo: string; email: string; initials: string }> = {
    master:   { nome: "Administrador", cargo: "Master", email: "master@jpmall.com.br", initials: "MA" },
    gerente:  { nome: "Gerência", cargo: "Gerente Operacional", email: "gerencia@jpmall.com.br", initials: "GR" },
    visitante:{ nome: currentUser?.nome ?? "Visitante", cargo: "Visitante", email: currentUser?.email ?? "", initials: currentUser?.initials ?? "VI" },
  };

  const defaults = PROFILE_DEFAULTS[currentProfile] ?? PROFILE_DEFAULTS.visitante;
  const meta = PROFILE_META[currentProfile];

  const [activeTab, setActiveTab] = useState<Tab>("perfil");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  const [nome, setNome] = useState(defaults.nome);
  const [cargo, setCargo] = useState(defaults.cargo);
  const [email, setEmail] = useState(defaults.email);
  const [telefone, setTelefone] = useState("(11) 99999-9999");
  const [saved, setSaved] = useState(false);
  const [editorState, setEditorState] = useState<EditorState>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleSave() {
    if (currentUser) {
      updateUserDetails(currentUser.id, { nome, cargo, email });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleCreateProfile(name: string, color: string, perms: PermissionSet) {
    createCustomProfile(name, color, perms);
    setEditorState(null);
  }

  function handleUpdateProfile(id: string, name: string, color: string, perms: PermissionSet) {
    updateCustomProfile(id, { name, color, permissions: perms });
    setEditorState(null);
  }

  function handleDeleteProfile(id: string) {
    deleteCustomProfile(id);
    setDeleteConfirm(null);
  }

  const allTabs: { id: Tab; label: string; icon: typeof User; masterOnly?: boolean }[] = [
    { id: "perfil",       label: "Perfil",       icon: User },
    { id: "notificacoes", label: "Notificações",  icon: Bell },
    { id: "seguranca",    label: "Segurança",     icon: Shield },
    { id: "permissoes",   label: "Permissões",    icon: ShieldCheck, masterOnly: true },
  ];

  const visibleTabs = allTabs.filter((t) => !t.masterOnly || isMaster);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <motion.div
        className="relative bg-white rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/5 w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Configurações</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* Sidebar — vertical on desktop, horizontal scroll on mobile */}
          <nav className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 pt-2 pb-5 sm:py-4 flex sm:flex-col gap-1 px-2 overflow-x-auto sm:overflow-x-visible scrollbar-thin [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setEditorState(null); }}
                  className={`flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-left whitespace-nowrap shrink-0 ${
                    activeTab === t.id ? "bg-[#8B1A1A] text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">

            {/* ── PERFIL ── */}
            {activeTab === "perfil" && (
              <div className="space-y-5 sm:space-y-6">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-3 sm:gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C8A882] text-[#8B1A1A] font-bold flex items-center justify-center text-xl sm:text-2xl">
                      {defaults.initials}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#8B1A1A] text-white rounded-full flex items-center justify-center shadow hover:bg-[#a43030] transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{nome}</p>
                    <p className="text-sm text-gray-500 truncate">{cargo}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#8B1A1A]" />
                      <span className="text-xs font-semibold text-[#8B1A1A]">JP Mall</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Permissão</label>
                  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 ${meta.border} ${meta.bg}`}>
                    <meta.icon className={`w-4 h-4 ${meta.text}`} />
                    <span className={`text-sm font-bold ${meta.text}`}>{meta.label}</span>
                  </div>
                  {!isMaster && <p className="mt-1.5 text-[11px] text-gray-400">Para alterar permissões, contate um usuário Master.</p>}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Nome</label>
                      <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Cargo</label>
                      <input value={cargo} onChange={(e) => setCargo(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">E-mail</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Telefone</label>
                    <input value={telefone} onChange={(e) => setTelefone(e.target.value)} type="tel" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]" />
                  </div>
                </div>

                <div className="flex justify-stretch sm:justify-end">
                  <button
                    onClick={handleSave}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saved ? "bg-emerald-600 text-white" : "bg-[#8B1A1A] hover:bg-[#a43030] text-white shadow-sm"}`}
                  >
                    {saved ? "Salvo!" : "Salvar alterações"}
                  </button>
                </div>
              </div>
            )}

            {/* ── NOTIFICAÇÕES ── */}
            {activeTab === "notificacoes" && (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Preferências de notificação</p>
                {[
                  { label: "Novos registros", desc: "Ao criar uma vistoria, multa ou ocorrência" },
                  { label: "Atualizações de processo", desc: "Avanço ou retorno de etapas" },
                  { label: "Multas vencidas", desc: "Alertas de multas não pagas" },
                  { label: "Relatórios semanais", desc: "Resumo enviado toda segunda-feira" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 peer-checked:bg-[#8B1A1A] rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-5 after:h-5 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* ── SEGURANÇA ── */}
            {activeTab === "seguranca" && (
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Acesso e segurança</p>
                {[
                  { label: "Alterar senha", desc: "Redefina sua senha de acesso" },
                  { label: "Autenticação em dois fatores", desc: "Adicione uma camada extra de proteção" },
                  { label: "Sessões ativas", desc: "Gerencie os dispositivos conectados" },
                ].map((item) => (
                  <button key={item.label} className="w-full flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#8B1A1A]/30 hover:bg-[#FAF7F2] transition-colors text-left">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* ── PERMISSÕES — master only ── */}
            {activeTab === "permissoes" && isMaster && (
              editorState ? (
                // ── Profile Editor ──
                <ProfileEditor
                  initial={editorState.mode === "edit" ? editorState.profile : undefined}
                  onCancel={() => setEditorState(null)}
                  onSave={(name, color, perms) => {
                    if (editorState.mode === "create") {
                      handleCreateProfile(name, color, perms);
                    } else {
                      handleUpdateProfile(editorState.profile.id, name, color, perms);
                    }
                  }}
                />
              ) : (
                // ── Main permissions view ──
                <div className="space-y-6">

                  {/* Custom profiles section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Perfis personalizados</p>
                        <p className="text-xs text-gray-500 mt-0.5">Crie perfis com permissões exatas para cada função.</p>
                      </div>
                      <button
                        onClick={() => setEditorState({ mode: "create" })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#8B1A1A] text-white text-xs font-bold rounded-xl hover:bg-[#a43030] transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Criar Perfil
                      </button>
                    </div>

                    {customProfiles.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                        <LayoutGrid className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 font-medium">Nenhum perfil personalizado</p>
                        <p className="text-xs text-gray-400 mt-1">Clique em "Criar Perfil" para começar.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customProfiles.map((p) => {
                          const enabledCount = Object.values(p.permissions).filter(Boolean).length;
                          const total = Object.keys(p.permissions).length;
                          const isConfirmingDelete = deleteConfirm === p.id;
                          return (
                            <div key={p.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                              {/* Color dot */}
                              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                <p className="text-[11px] text-gray-400">{enabledCount}/{total} permissões ativas</p>
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                {isConfirmingDelete ? (
                                  <>
                                    <span className="text-xs text-red-600 font-semibold mr-1">Confirmar?</span>
                                    <button onClick={() => handleDeleteProfile(p.id)} className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">Sim</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200">Não</button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setEditorState({ mode: "edit", profile: p })}
                                      className="p-2 text-gray-400 hover:text-[#8B1A1A] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                                      title="Editar perfil"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(p.id)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Excluir perfil"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Users section */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Usuários cadastrados</p>
                    <p className="text-xs text-gray-500 mb-3">Atribua um perfil a cada usuário do sistema.</p>
                    <div className="space-y-2">
                      {users.map((u) => (
                        <UserProfileSelector key={u.id} user={u} customProfiles={customProfiles} />
                      ))}
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-[11px] text-amber-800 font-semibold">
                      Alterações são aplicadas imediatamente. Perfis personalizados substituem as permissões do perfil padrão.
                    </p>
                  </div>
                </div>
              )
            )}

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
