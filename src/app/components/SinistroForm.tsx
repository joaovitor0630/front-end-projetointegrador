import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, FileText, TrendingUp, Calendar, DollarSign, UserCheck, MapPin } from 'lucide-react';
import { STORES_INFO } from '../recordsStore';
import logoFlamboyant from 'figma:asset/b02a990bf2c2da1561fd2f42223c5d2ce71ec09a.png';

type Gravidade = 'alta' | 'media' | 'baixa';

interface Sinistro {
  tipo: string;
  gravidade: Gravidade;
  dataResolucao: string;
  valorIndenizacao: number;
  franquia: number;
  loja: string;
  regulador: string;
  dataCriacao: string;
}

export function SinistroForm() {
  const [sinistro, setSinistro] = useState<Sinistro>({
    tipo: '',
    gravidade: 'media',
    dataResolucao: '',
    valorIndenizacao: 0,
    franquia: 0,
    loja: '',
    regulador: '',
    dataCriacao: '',
  });
  
  const [sinistros, setSinistros] = useState<Sinistro[]>([]);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const [filtroLoja, setFiltroLoja] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const reguladores = [
    'João Silva',
    'Maria Santos',
    'Pedro Oliveira',
    'Ana Costa',
    'Carlos Ferreira',
  ];

  const gravidadeConfig = {
    alta: {
      label: 'Alta',
      color: 'bg-red-600',
      borderColor: 'border-red-600',
      textColor: 'text-red-700',
      bgLight: 'bg-red-50',
    },
    media: {
      label: 'Média',
      color: 'bg-amber-500',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-700',
      bgLight: 'bg-amber-50',
    },
    baixa: {
      label: 'Baixa',
      color: 'bg-emerald-600',
      borderColor: 'border-emerald-600',
      textColor: 'text-emerald-700',
      bgLight: 'bg-emerald-50',
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sinistro.tipo && sinistro.dataResolucao && sinistro.loja && sinistro.regulador) {
      const novoSinistro = {
        ...sinistro,
        dataCriacao: new Date().toISOString().split('T')[0],
      };
      setSinistros([...sinistros, novoSinistro]);
      setSinistro({ 
        tipo: '', 
        gravidade: 'media', 
        dataResolucao: '',
        valorIndenizacao: 0,
        franquia: 0,
        loja: '',
        regulador: '',
        dataCriacao: '',
      });
      setMostrarSucesso(true);
      setTimeout(() => setMostrarSucesso(false), 3000);
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calcularValorLiquido = (valorIndenizacao: number, franquia: number) => {
    return Math.max(0, valorIndenizacao - franquia);
  };

  const filtrados = sinistros.filter(s => {
    const matchLoja = !filtroLoja || s.loja === filtroLoja;
    const matchDataInicio = !filtroDataInicio || s.dataCriacao >= filtroDataInicio;
    const matchDataFim = !filtroDataFim || s.dataCriacao <= filtroDataFim;
    return matchLoja && matchDataInicio && matchDataFim;
  });

  const stats = {
    total: filtrados.length,
    totalIndenizacao: filtrados.reduce((acc, s) => acc + s.valorIndenizacao, 0),
    totalFranquia: filtrados.reduce((acc, s) => acc + s.franquia, 0),
    totalLiquido: filtrados.reduce((acc, s) => acc + calcularValorLiquido(s.valorIndenizacao, s.franquia), 0),
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <motion.div 
        layout
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#8B1A1A] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <img src={logoFlamboyant} alt="Flamboyant" className="h-16 brightness-0 invert" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight mb-2">Sinistros & Ocorrências</h1>
            <p className="text-white/70 font-medium">Registro técnico e acompanhamento de indenizações do shopping.</p>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setMostrarRelatorio(false)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${!mostrarRelatorio ? 'bg-white text-[#8B1A1A] shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Novo Registro
            </button>
            <button
              onClick={() => setMostrarRelatorio(true)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mostrarRelatorio ? 'bg-white text-[#8B1A1A] shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Relatórios e BI
            </button>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {!mostrarRelatorio ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {mostrarSucesso && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <p className="text-emerald-700 font-bold">Sinistro registrado com sucesso no banco de dados.</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Coluna 1 */}
                    <div className="space-y-6">
                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
                          <AlertCircle className="w-3.5 h-3.5 text-[#8B1A1A]" /> Tipo de Sinistro
                        </label>
                        <input
                          type="text"
                          value={sinistro.tipo}
                          onChange={(e) => setSinistro({ ...sinistro, tipo: e.target.value })}
                          placeholder="Ex: Vazamento, Colisão, Incêndio"
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#8B1A1A]/5 focus:border-[#8B1A1A] transition-all font-medium"
                          required
                        />
                      </div>

                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8B1A1A]" /> Loja / Unidade
                        </label>
                        <select
                          value={sinistro.loja}
                          onChange={(e) => setSinistro({ ...sinistro, loja: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#8B1A1A]/5 focus:border-[#8B1A1A] transition-all font-medium appearance-none"
                          required
                        >
                          <option value="">Selecione a loja afetada</option>
                          {STORES_INFO.map((s) => (
                            <option key={s.name} value={s.name}>{s.name} ({s.luc})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                          <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
                            <DollarSign className="w-3.5 h-3.5 text-[#8B1A1A]" /> Valor Indenização
                          </label>
                          <input
                            type="number"
                            value={sinistro.valorIndenizacao || ''}
                            onChange={(e) => setSinistro({ ...sinistro, valorIndenizacao: parseFloat(e.target.value) || 0 })}
                            placeholder="R$ 0,00"
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#8B1A1A]/5 focus:border-[#8B1A1A] transition-all font-bold"
                            required
                          />
                        </div>
                        <div className="group">
                          <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
                            <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Franquia
                          </label>
                          <input
                            type="number"
                            value={sinistro.franquia || ''}
                            onChange={(e) => setSinistro({ ...sinistro, franquia: parseFloat(e.target.value) || 0 })}
                            placeholder="R$ 0,00"
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#8B1A1A]/5 focus:border-[#8B1A1A] transition-all font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Coluna 2 */}
                    <div className="space-y-6">
                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
                          <UserCheck className="w-3.5 h-3.5 text-[#8B1A1A]" /> Regulador Responsável
                        </label>
                        <select
                          value={sinistro.regulador}
                          onChange={(e) => setSinistro({ ...sinistro, regulador: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#8B1A1A]/5 focus:border-[#8B1A1A] transition-all font-medium appearance-none"
                          required
                        >
                          <option value="">Selecione o perito</option>
                          {reguladores.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8B1A1A]" /> Data para Resolução
                        </label>
                        <input
                          type="date"
                          value={sinistro.dataResolucao}
                          onChange={(e) => setSinistro({ ...sinistro, dataResolucao: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#8B1A1A]/5 focus:border-[#8B1A1A] transition-all font-medium"
                          required
                        />
                      </div>

                      <div className="group">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1 block">Prioridade do Atendimento</label>
                        <div className="grid grid-cols-3 gap-3">
                          {(Object.keys(gravidadeConfig) as Gravidade[]).map((nivel) => {
                            const config = gravidadeConfig[nivel];
                            const isSelected = sinistro.gravidade === nivel;
                            return (
                              <button
                                key={nivel}
                                type="button"
                                onClick={() => setSinistro({ ...sinistro, gravidade: nivel })}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? `${config.borderColor} ${config.bgLight} shadow-lg scale-105` : 'border-gray-100 bg-white hover:border-gray-200 opacity-60'}`}
                              >
                                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? config.textColor : 'text-gray-400'}`}>
                                  {config.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#C8A882]/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#8B7355] uppercase tracking-widest">Valor Líquido Estimado</p>
                      <p className="text-3xl font-black text-[#8B1A1A]">{formatarMoeda(calcularValorLiquido(sinistro.valorIndenizacao, sinistro.franquia))}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-10 py-4 bg-[#8B1A1A] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-[#a43030] transition-all"
                    >
                      Efetivar Registro
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="reports"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Registros", value: stats.total, color: "bg-blue-600" },
                    { label: "Indenizações", value: formatarMoeda(stats.totalIndenizacao), color: "bg-purple-600" },
                    { label: "Franquias", value: formatarMoeda(stats.totalFranquia), color: "bg-amber-600" },
                    { label: "Volume Líquido", value: formatarMoeda(stats.totalLiquido), color: "bg-emerald-600" },
                  ].map((s, i) => (
                    <div key={i} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-xl font-black text-gray-900">{s.value}</p>
                      <div className={`h-1 w-8 ${s.color} rounded-full mt-3`} />
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <select
                    value={filtroLoja}
                    onChange={(e) => setFiltroLoja(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#8B1A1A]/10 outline-none"
                  >
                    <option value="">Todas as lojas</option>
                    {STORES_INFO.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                  <input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                  />
                  <div className="text-gray-400 font-bold text-xs uppercase">até</div>
                  <input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>

                {/* Records List */}
                <div className="space-y-4">
                  {filtrados.map((s, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                      className="p-6 bg-white border border-gray-100 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-[#8B1A1A]/20 transition-all group shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${gravidadeConfig[s.gravidade].bgLight} flex items-center justify-center shrink-0`}>
                          <div className={`w-3 h-3 rounded-full ${gravidadeConfig[s.gravidade].color}`} />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 group-hover:text-[#8B1A1A] transition-colors">{s.tipo}</h4>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">{s.loja} • {s.regulador}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-8 items-center w-full md:w-auto">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolução</p>
                          <p className="text-sm font-bold text-gray-700">{formatarData(s.dataResolucao)}</p>
                        </div>
                        <div className="text-right px-6 py-3 bg-[#FAF7F2] rounded-2xl border border-[#C8A882]/10 min-w-[140px]">
                          <p className="text-[10px] font-black text-[#8B7355] uppercase tracking-widest">Líquido</p>
                          <p className="text-lg font-black text-[#8B1A1A]">{formatarMoeda(calcularValorLiquido(s.valorIndenizacao, s.franquia))}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filtrados.length === 0 && (
                    <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum registro para exibir</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
