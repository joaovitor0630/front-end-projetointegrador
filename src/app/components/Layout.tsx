import { useState } from "react";
import { SettingsModal } from "./SettingsModal";
import { useProfile, useCurrentUser, useCurrentPermissions, logout } from "../profileStore";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Building2,
  Home,
  FileText,
  Users,
  BarChart3,
  LogOut,
  ShieldAlert,
  Bell,
  ClipboardList,
  Menu,
  X,
  List,
  GitBranch,
  Activity,
  CheckCheck,
  Layers,
  Flame,
  HardHat,
  Building,
  ShieldCheck,
} from "lucide-react";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const currentProfile = useProfile();
  const currentUser = useCurrentUser();
  const perms = useCurrentPermissions();
  const profileLabel = currentUser?.nome ?? (currentProfile === "master" ? "Administrador" : "Gerência");
  const profileInitials = currentUser?.initials ?? (currentProfile === "master" ? "MA" : "GR");
  const isRecordsRoute = location.pathname.startsWith("/registros");
  const isConformidadeRoute = location.pathname.startsWith("/conformidade");
  const isGestaoRoute = isRecordsRoute || isConformidadeRoute;
  const params = new URLSearchParams(location.search);
  const currentTab = params.get("tab") || "registros";
  const recordSubs: { id: string; label: string; icon: typeof List; path?: string }[] = [
    { id: "registros", label: "Ocorrências", icon: List },
    { id: "atividade", label: "Atividades", icon: Activity },
    { id: "conformidade", label: "Conformidade", icon: ShieldCheck, path: "/conformidade" },
  ];
  
  return (
    <div className="flex h-screen w-full bg-[#F7F4EF]">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#8B1A1A] text-white flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#a43030]">
          <div className="flex items-center">
            <Building2 className="w-6 h-6 mr-3 text-[#C8A882]" />
            <span className="font-bold text-lg tracking-wide">JP Mall</span>
          </div>
          <button 
            className="md:hidden p-1 hover:bg-[#a43030] rounded-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {perms.viewDashboard && (
            <NavLink
              to="/dashboard"
              onClick={() => setIsSidebarOpen(false)}
              className={({isActive}) => `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#a43030] text-white' : 'text-white/80 hover:bg-[#a43030]/50 hover:text-white'}`}
            >
              <Home className="w-5 h-5 mr-3 opacity-90" /> Dashboard
            </NavLink>
          )}
          {perms.viewClaims && (
            <NavLink
              to="/novo-sinistro"
              onClick={() => setIsSidebarOpen(false)}
              className={({isActive}) => `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#a43030] text-white' : 'text-white/80 hover:bg-[#a43030]/50 hover:text-white'}`}
            >
              <ShieldAlert className="w-5 h-5 mr-3 opacity-90" /> Novo Sinistro
            </NavLink>
          )}
          {perms.viewHistory && (
            <NavLink
              to="/historico"
              onClick={() => setIsSidebarOpen(false)}
              className={({isActive}) => `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#a43030] text-white' : 'text-white/80 hover:bg-[#a43030]/50 hover:text-white'}`}
            >
              <FileText className="w-5 h-5 mr-3 opacity-90" /> Histórico
            </NavLink>
          )}
          {perms.viewStoreDirectory && (
            <NavLink
              to="/lojistas"
              onClick={() => setIsSidebarOpen(false)}
              className={({isActive}) => `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#a43030] text-white' : 'text-white/80 hover:bg-[#a43030]/50 hover:text-white'}`}
            >
              <Users className="w-5 h-5 mr-3 opacity-90" /> Lojistas
            </NavLink>
          )}
          {perms.viewOperacional && (
            <NavLink
              to="/registros"
              end
              onClick={() => setIsSidebarOpen(false)}
              className={({isActive}) => `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isGestaoRoute ? 'bg-[#a43030] text-white' : 'text-white/80 hover:bg-[#a43030]/50 hover:text-white'}`}
            >
              <ClipboardList className="w-5 h-5 mr-3 opacity-90" /> Gestão Operacional
            </NavLink>
          )}
          {perms.viewOperacional && isGestaoRoute && (
            <div className="pl-4 mt-1 space-y-1 border-l border-[#a43030] ml-4">
              {recordSubs
                .filter((s) => s.id === "conformidade" ? perms.viewConformity : perms.viewRecords)
                .map((s) => {
                  const Icon = s.icon;
                  const isExternal = !!s.path;
                  const active = isExternal ? isConformidadeRoute : isRecordsRoute && currentTab === s.id;
                  return isExternal ? (
                    <NavLink
                      key={s.id}
                      to={s.path!}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${active ? 'bg-[#a43030]/70 text-white' : 'text-white/70 hover:bg-[#a43030]/40 hover:text-white'}`}
                    >
                      <Icon className="w-4 h-4 mr-2 opacity-90" /> {s.label}
                    </NavLink>
                  ) : (
                    <NavLink
                      key={s.id}
                      to={`/registros?tab=${s.id}`}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${active ? 'bg-[#a43030]/70 text-white' : 'text-white/70 hover:bg-[#a43030]/40 hover:text-white'}`}
                    >
                      <Icon className="w-4 h-4 mr-2 opacity-90" /> {s.label}
                    </NavLink>
                  );
                })}
            </div>
          )}
          {perms.viewReports && (
            <NavLink
              to="/relatorios"
              onClick={() => setIsSidebarOpen(false)}
              className={({isActive}) => `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#a43030] text-white' : 'text-white/80 hover:bg-[#a43030]/50 hover:text-white'}`}
            >
              <BarChart3 className="w-5 h-5 mr-3 opacity-90" /> Relatórios
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-[#a43030] space-y-2">
          {currentProfile === "visitante" && (
            <div className="px-3 py-2 rounded-lg bg-white/10 text-white/70 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              Acesso somente leitura
            </div>
          )}
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-[#a43030]/50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-10">
          <div className="flex items-center gap-3 md:gap-0 flex-1 max-w-xl">
            <button 
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Search Placeholder */}
            <div className="relative flex-1">
              
              
            </div>
          </div>
          
          <div className="flex items-center ml-4 md:ml-6 space-x-2 md:space-x-4">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#D93030] rounded-full"></span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center space-x-2 md:space-x-3 border-l border-gray-200 pl-2 md:pl-4 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-sm font-medium text-gray-900 leading-none">{profileLabel}</span>
                <span className="text-[10px] text-gray-500">JP Mall</span>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#C8A882] text-[#8B1A1A] font-bold flex items-center justify-center text-sm">
                {profileInitials}
              </div>
            </button>
          </div>
        </header>

        {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname + (new URLSearchParams(location.search).get("tab") ?? "")}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}