import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { 
  AlertTriangle, 
  Clock, 
  FileWarning, 
  TrendingUp,
  Search,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Store
} from "lucide-react";
import { getClaims, Claim } from "../store";

export function Dashboard() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setClaims(getClaims());
  }, []);

  const openClaims = claims.filter(c => c.status === "Aberto" || c.status === "Em Análise").length;
  const waitingRegulator = claims.filter(c => c.status === "Aguardando Regulador").length;
  const fraudAlerts = claims.filter(c => c.fraudAlert).length;

  const filteredClaims = claims.filter(c => 
    c.store.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock data for chart
  const chartData = [
    { name: 'Loja A', incidentes: 4 },
    { name: 'Loja B', incidentes: 2 },
    { name: 'Praça de Alim.', incidentes: 5 },
    { name: 'Estacionamento', incidentes: 3 },
    { name: 'Banheiros', incidentes: 1 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Painel de Controle</h1>
          <p className="text-gray-500 mt-1 font-medium">Monitoramento em tempo real de sinistros e conformidade.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/novo-sinistro")}
          className="bg-[#8B1A1A] hover:bg-[#a43030] text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
        >
          <FileWarning className="w-5 h-5" />
          Registrar Ocorrência
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Sinistros Abertos", value: openClaims, icon: FileWarning, color: "text-blue-600", bg: "bg-blue-50", trend: "-12%", trendUp: false },
          { label: "Aguardando Regulador", value: waitingRegulator, icon: Clock, color: "text-orange-600", bg: "bg-orange-50", trend: "Urgente", trendUp: true },
          { label: "Alertas de Fraude", value: fraudAlerts, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", trend: "Alerta Crítico", trendUp: true },
        ].map((kpi, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start justify-between group cursor-default transition-all hover:shadow-xl"
          >
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{kpi.label}</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{kpi.value}</h3>
              <div className={`mt-3 flex items-center gap-1.5 text-xs font-bold ${kpi.trendUp ? 'text-red-500' : 'text-emerald-500'}`}>
                {kpi.trendUp ? <AlertTriangle className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {kpi.trend}
              </div>
            </div>
            <div className={`w-14 h-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12`}>
              <kpi.icon className="w-7 h-7" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 lg:col-span-2"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Incidência por Área</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-full border border-gray-100">Últimos 30 dias</span>
            </div>
          </div>
          <div className="h-64 w-full flex items-end gap-4 md:gap-8 pt-4">
            {(() => {
              const maxVal = Math.max(...chartData.map(d => d.incidentes));
              return chartData.map((d, idx) => (
                <div key={d.name} className="flex-1 flex flex-col items-center gap-3">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.round((d.incidentes / maxVal) * 180)}px` }}
                    transition={{ delay: 0.5 + (idx * 0.1), duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-[40px] rounded-t-xl bg-gradient-to-b from-[#8B1A1A] to-[#C8A882] shadow-inner"
                  />
                  <span className="text-[10px] font-black text-gray-400 uppercase text-center leading-tight">{d.name}</span>
                </div>
              ));
            })()}
          </div>
        </motion.div>

        {/* Quick Search & Summary */}
        <motion.div 
          variants={itemVariants}
          className="bg-[#8B1A1A] text-white rounded-2xl shadow-xl p-8 flex flex-col relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-125 duration-700" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-[#C8A882]" />
            </div>
            <h3 className="text-xl font-black mb-3 leading-tight tracking-tight">Consulta Rápida de Apólices</h3>
            <p className="text-white/70 text-sm mb-8 leading-relaxed">Verifique a validade do seguro e o status operacional de qualquer lojista.</p>
            
            <div className="space-y-4 mt-auto">
              <div className="bg-white/10 rounded-xl p-1.5 border border-white/20 flex items-center transition-all focus-within:bg-white/20 focus-within:ring-2 focus-within:ring-white/30">
                <input 
                  type="text" 
                  placeholder="CNPJ ou Nome da Loja" 
                  className="bg-transparent border-none text-white placeholder-white/50 focus:ring-0 w-full px-4 text-sm font-medium"
                />
                <button className="p-2.5 bg-white text-[#8B1A1A] rounded-lg hover:bg-gray-100 transition-all active:scale-95 shadow-lg">
                  <Search className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-widest pl-2">
                <Store className="w-3.5 h-3.5" />
                {chartData.length} Lojas monitoradas
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Table */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-7 py-5 border-b border-gray-50 flex flex-col sm:row justify-between items-start sm:items-center gap-4 bg-gray-50/30">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Últimas Ocorrências</h3>
          <div className="relative w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Pesquisar na lista..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A] transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-7 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Nº Sinistro</th>
                <th className="px-7 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Local / Lojista</th>
                <th className="px-7 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                <th className="px-7 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-7 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Gravidade</th>
                <th className="px-7 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClaims.map((claim) => (
                <motion.tr 
                  layout
                  key={claim.id} 
                  className="group hover:bg-[#FAF7F2] transition-colors cursor-pointer" 
                  onClick={() => navigate(`/sinistro/${claim.id}`)}
                >
                  <td className="px-7 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      {claim.id}
                      {claim.fraudAlert && (
                        <div className="p-1 bg-red-50 rounded-md text-red-500" title="Alerta de Fraude">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-[#8B1A1A] transition-colors">{claim.store}</span>
                      <span className="text-xs text-gray-400 font-medium">{claim.type}</span>
                    </div>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {new Date(claim.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-full 
                      ${claim.status === 'Aberto' ? 'bg-blue-50 text-blue-700 border border-blue-100' : ''}
                      ${claim.status === 'Aguardando Regulador' ? 'bg-orange-50 text-orange-700 border border-orange-100' : ''}
                      ${claim.status === 'Em Análise' ? 'bg-amber-50 text-amber-700 border border-amber-100' : ''}
                      ${claim.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : ''}
                      ${claim.status === 'Pago' ? 'bg-gray-50 text-gray-700 border border-gray-100' : ''}
                    `}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap">
                    <div className="flex items-center text-xs font-bold">
                      <div className={`w-2 h-2 rounded-full mr-2.5 
                        ${claim.severity === 'Alta' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}
                        ${claim.severity === 'Média' ? 'bg-amber-400' : ''}
                        ${claim.severity === 'Baixa' ? 'bg-emerald-400' : ''}
                      `} />
                      {claim.severity}
                    </div>
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap text-right">
                    <button className="text-gray-300 group-hover:text-[#8B1A1A] transition-all transform group-hover:translate-x-1">
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredClaims.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold text-sm">Nenhum sinistro localizado.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

