import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Lock, Mail, ShieldAlert, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { login, register } from "../profileStore";

type Mode = "login" | "register";

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("master@jpmall.com.br");
  const [loginPassword, setLoginPassword] = useState("master123");
  const [loginError, setLoginError] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register fields
  const [regNome, setRegNome] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const result = login(loginEmail, loginPassword);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      setLoginError(result.error ?? "Erro ao entrar.");
    }
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (!regNome.trim()) return setRegError("Informe seu nome.");
    if (!regEmail.trim()) return setRegError("Informe seu e-mail.");
    if (regPassword.length < 6) return setRegError("A senha deve ter no mínimo 6 caracteres.");
    if (regPassword !== regConfirm) return setRegError("As senhas não coincidem.");
    const result = register(regNome, regEmail, regPassword);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      setRegError(result.error ?? "Erro ao cadastrar.");
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-center py-6 md:py-12 px-3 sm:px-6 lg:px-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#8B1A1A] to-[#a43030] shadow-xl flex items-center justify-center cursor-pointer"
          >
            <Building2 className="w-8 h-8 md:w-10 md:h-10 text-[#C8A882]" />
          </motion.div>
          <h2 className="mt-4 md:mt-6 text-center text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">JP Mall</h2>
          <p className="mt-1 md:mt-2 text-center text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wider">Gestão Operacional Integrada</p>
        </div>
      </motion.div>

      <div className="mt-6 md:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          layout
          className="bg-white py-6 md:py-8 px-4 sm:px-6 md:px-10 shadow-2xl sm:rounded-xl md:rounded-2xl border-t-4 border-[#8B1A1A] overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex items-start">
                  <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 mt-0.5 flex-shrink-0 text-amber-600" />
                  <div className="text-xs md:text-sm font-medium">
                    Acesso restrito. Utilize credenciais autorizadas pela administração do JP Mall.
                  </div>
                </div>

                <form className="space-y-4 md:space-y-5" onSubmit={handleLogin}>
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-1.5 ml-1">E-mail Corporativo</label>
                    <div className="relative group">
                      <Mail className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400 pointer-events-none group-focus-within:text-[#8B1A1A] transition-colors" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
                        className="block w-full pl-9 md:pl-11 pr-3 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] text-sm transition-all"
                        placeholder="master@jpmall.com.br"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-1.5 ml-1">Senha de Acesso</label>
                    <div className="relative group">
                      <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400 pointer-events-none group-focus-within:text-[#8B1A1A] transition-colors" />
                      <input
                        type={showLoginPw ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                        className="block w-full pl-9 md:pl-11 pr-10 md:pr-11 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] text-sm transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPw((v) => !v)}
                        className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#8B1A1A] p-1 rounded-md transition-colors"
                      >
                        {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] md:text-xs text-red-600 font-bold bg-red-50 border border-red-100 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 flex items-center gap-1.5 md:gap-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                      <span>{loginError}</span>
                    </motion.p>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] md:text-xs">
                    <label className="flex items-center gap-1.5 md:gap-2 cursor-pointer text-gray-600 font-medium">
                      <input type="checkbox" className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#8B1A1A] focus:ring-[#8B1A1A] border-gray-300 rounded" />
                      <span>Lembrar neste dispositivo</span>
                    </label>
                    <a href="#" className="font-bold text-[#8B1A1A] hover:underline underline-offset-4 transition-all whitespace-nowrap">Esqueceu a senha?</a>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full flex justify-center py-3 md:py-3.5 px-4 rounded-lg md:rounded-xl shadow-lg text-xs md:text-sm font-black text-white bg-[#8B1A1A] hover:bg-[#a43030] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1A1A] transition-all"
                  >
                    ENTRAR NO SISTEMA
                  </motion.button>

                  <div className="text-center text-[10px] md:text-xs text-gray-400 font-medium pt-2 uppercase tracking-widest">
                    Não possui conta?{" "}
                    <button type="button" onClick={() => { setMode("register"); setLoginError(""); }} className="font-black text-[#8B1A1A] hover:text-[#a43030] transition-colors">
                      SOLICITAR ACESSO
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => { setMode("login"); setRegError(""); }}
                  className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-bold text-gray-400 hover:text-gray-800 mb-4 md:mb-6 transition-colors uppercase tracking-widest"
                >
                  <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Voltar ao Login
                </button>

                <div className="mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-black text-gray-900">Solicitar Acesso</h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-1.5 md:mt-2 leading-relaxed">
                    Novas contas iniciam com perfil de <span className="font-bold text-[#8B1A1A]">Visitante</span>. Contate o administrador para privilégios de edição.
                  </p>
                </div>

                <form className="space-y-3 md:space-y-4" onSubmit={handleRegister}>
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-1.5 ml-1">Nome Completo</label>
                    <div className="relative group">
                      <User className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400 pointer-events-none group-focus-within:text-[#8B1A1A] transition-colors" />
                      <input
                        type="text"
                        required
                        value={regNome}
                        onChange={(e) => { setRegNome(e.target.value); setRegError(""); }}
                        placeholder="Ex: João da Silva"
                        className="block w-full pl-9 md:pl-11 pr-3 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-1.5 ml-1">E-mail Corporativo</label>
                    <div className="relative group">
                      <Mail className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400 pointer-events-none group-focus-within:text-[#8B1A1A] transition-colors" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => { setRegEmail(e.target.value); setRegError(""); }}
                        placeholder="usuario@jpmall.com.br"
                        className="block w-full pl-9 md:pl-11 pr-3 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-1.5 ml-1">Senha</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => { setRegPassword(e.target.value); setRegError(""); }}
                        placeholder="Mín. 6 chars"
                        className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-1.5 ml-1">Confirmar</label>
                      <input
                        type="password"
                        required
                        value={regConfirm}
                        onChange={(e) => { setRegConfirm(e.target.value); setRegError(""); }}
                        placeholder="Repita a senha"
                        className="block w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] text-sm"
                      />
                    </div>
                  </div>

                  {regError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] md:text-xs text-red-600 font-bold bg-red-50 border border-red-100 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 flex items-center gap-1.5 md:gap-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                      <span>{regError}</span>
                    </motion.p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full flex justify-center py-3 md:py-3.5 px-4 rounded-lg md:rounded-xl shadow-lg text-xs md:text-sm font-black text-white bg-[#8B1A1A] hover:bg-[#a43030] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1A1A] transition-all"
                  >
                    CRIAR MINHA CONTA
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

