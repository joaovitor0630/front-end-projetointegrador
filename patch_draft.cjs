const fs = require('fs');
const path = 'c:/Users/carva/Desktop/codigo/Sinistro interface design/src/app/pages/Records.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const [showForm, setShowForm] = useState(false);',
  'const [showForm, setShowForm] = useState(() => !!sessionStorage.getItem("draft_smart_form"));'
);

const stateInitCode = `
    const [kind, setKind] = useState<RecordKind | "">(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.kind || editing?.kind || prefillKind || ""; } catch { return editing?.kind || prefillKind || ""; }
    });
    const [area, setArea] = useState<Area | "">(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.area || editing?.area || ""; } catch { return editing?.area || ""; }
    });
    const [vistoriaAreas, setVistoriaAreas] = useState<Area[]>(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.vistoriaAreas || (editing?.kind === "vistoria" ? [(editing.area as Area), ...(editing.additionalAreas || [])] : []); } catch { return editing?.kind === "vistoria" ? [(editing.area as Area), ...(editing.additionalAreas || [])] : []; }
    });
    const [inspectionDate, setInspectionDate] = useState<string>(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.inspectionDate || editing?.inspectionDate?.slice(0, 10) || ""; } catch { return editing?.inspectionDate?.slice(0, 10) || ""; }
    });
    const [inspector, setInspector] = useState<string>(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.inspector || editing?.inspector || ""; } catch { return editing?.inspector || ""; }
    });
    const [store, setStore] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.store || editing?.store || ""; } catch { return editing?.store || ""; }
    });
    const [storeQuery, setStoreQuery] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.storeQuery || editing?.store || ""; } catch { return editing?.store || ""; }
    });
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [luc, setLuc] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.luc || editing?.luc || ""; } catch { return editing?.luc || ""; }
    });
    const [subject, setSubject] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.subject || editing?.subject || ""; } catch { return editing?.subject || ""; }
    });
    const [details, setDetails] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.details || editing?.details || ""; } catch { return editing?.details || ""; }
    });
    const [amount, setAmount] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.amount || editing?.amount?.toString() || ""; } catch { return editing?.amount?.toString() || ""; }
    });
    const [taxonomy, setTaxonomy] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.taxonomy || editing?.taxonomy || ""; } catch { return editing?.taxonomy || ""; }
    });
    const [files, setFiles] = useState<Attachment[]>(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.files || editing?.attachments || []; } catch { return editing?.attachments || []; }
    });
`;

code = code.replace(
  /const \[kind, setKind\] = useState<RecordKind \| "">\(editing\?\.kind \|\| prefillKind \|\| ""\);[\s\S]*?const \[files, setFiles\] = useState<Attachment\[\]>\(editing\?\.attachments \|\| \[\]\);/,
  stateInitCode.trim()
);

const useEffectCode = `
  useEffect(() => {
    try {
      sessionStorage.setItem("draft_smart_form", JSON.stringify({
        kind, area, vistoriaAreas, inspectionDate, inspector, store, storeQuery, luc, subject, details, amount, taxonomy, files
      }));
    } catch (e) {
      console.warn("Could not save draft to sessionStorage", e);
    }
  }, [kind, area, vistoriaAreas, inspectionDate, inspector, store, storeQuery, luc, subject, details, amount, taxonomy, files]);

  function submit() {
`;

code = code.replace('  function submit() {', useEffectCode);

code = code.replace(
  '  <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50">Cancelar</button>',
  '  <button onClick={() => { sessionStorage.removeItem("draft_smart_form"); onClose(); }} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50">Cancelar</button>'
);

code = code.replace(
  /onClose\(\);\s*}/g,
  'sessionStorage.removeItem("draft_smart_form");\n    onClose();\n  }'
);

fs.writeFileSync(path, code);
console.log("Draft state persistence injected.");
