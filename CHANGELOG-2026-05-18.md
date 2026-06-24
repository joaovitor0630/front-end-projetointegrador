# Changelog — JP Mall · 18 de maio de 2026

Resumo das mudanças aplicadas ao sistema na sessão de hoje.

---

## 1. Limpeza do store de dados (`src/app/recordsStore.ts`)

- Removidos todos os registros antigos (legados) que não seguiam o modelo atual dos três tipos de registro.
- Inseridos dados seed limpos seguindo estritamente as regras de cada tipo:
  - **5 Ocorrências** — área única, categoria por área, loja, assunto, descrição, sem campo de resultado, com possibilidade de anexar notificações.
  - **4 Vistorias** — múltiplas áreas (`additionalAreas`), categorias "Reforma loja" / "Novo contrato", com `inspectionDate` e `inspector`, sem resultado.
  - **5 Multas** — sem área principal, categorias entre "Manutenção e Engenharia", "Arquitetura e Paisagismo", "Conservação e Resíduos" e "Segurança e Brigada", sem descrição e vinculadas apenas a ocorrências.

## 2. Ícones de tipo na aba "Todos" (Ocorrências)

- Os ícones identificadores de **Ocorrência**, **Vistoria**, **Multa** e **Notificação** passaram a ser exibidos ao lado do nome da loja no dashboard de Ocorrências (aba "Todos").

## 3. Exportação de PDF de Conformidade (`src/app/pages/StoreConformity.tsx`)

Refatoração da seção de multas no modal de exportação e no HTML do relatório:

- **Renomeação semântica**: a antiga seção "Multas pagas" foi substituída por "Multas faturadas" — o status `Paga` não existe mais no fluxo de multas (apenas `Pendente`, `Faturada` e `Cancelada`).
- Atualizações específicas:
  - Tipo `ExportSection`: `multasPagas` → `multasFaturadas`.
  - Removida a derivação obsoleta `multasPagas = multas.filter(m => m.status === "Paga")`.
  - Label da checkbox: "Multas pagas" → "Multas faturadas".
  - Título da seção no PDF: "Multas Pagas" → "Multas Faturadas".
  - Resumo financeiro: removida a linha de "multas pagas"; a linha de "multas faturadas" passou a usar a cor verde (`#059669`) que antes representava as pagas.
- **Auto-seleção da checkbox**: as checkboxes de "Multas faturadas" e "Multas canceladas" agora marcam automaticamente quando há registros correspondentes na loja (antes ficavam sempre desmarcadas, mesmo havendo dados).

## 4. Correção de warnings do Recharts (`src/app/pages/Reports.tsx`)

- Resolvido o aviso `Encountered two children with the same key, null` disparado pelo `CategoricalChartWrapper` do `recharts@2.15.2`.
- Adicionado `key` explícito em todos os filhos diretos do `BarChart` (`CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Bar`) e do `PieChart` (`Pie`, `Tooltip`, `Legend`).

---

## Arquivos alterados

- `src/app/recordsStore.ts`
- `src/app/pages/StoreConformity.tsx`
- `src/app/pages/Reports.tsx`
- (ajustes anteriores na sessão) `src/app/pages/Records.tsx` para suporte aos ícones por tipo de registro
