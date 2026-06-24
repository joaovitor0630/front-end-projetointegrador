const fs = require('fs');
const path = 'c:/Users/carva/Desktop/codigo/Sinistro interface design/src/app/pages/Records.tsx';
let code = fs.readFileSync(path, 'utf8');

const missingVars = `
    const [taxonomyQuery, setTaxonomyQuery] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.taxonomyQuery || editing?.taxonomy || ""; } catch { return editing?.taxonomy || ""; }
    });
    const [taxonomyDropdownOpen, setTaxonomyDropdownOpen] = useState(false);
    const [status, setStatus] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.status || editing?.status || ""; } catch { return editing?.status || ""; }
    });
`;

code = code.replace(
  /const \[taxonomy, setTaxonomy\] = useState\(\(\) => \{[\s\S]*?\}\);/,
  `$&${missingVars}`
);

code = code.replace(
  /kind, area, vistoriaAreas, inspectionDate, inspector, store, storeQuery, luc, subject, details, amount, taxonomy, files/g,
  `kind, area, vistoriaAreas, inspectionDate, inspector, store, storeQuery, luc, subject, details, amount, taxonomy, taxonomyQuery, status, files`
);

fs.writeFileSync(path, code);
console.log("Restored missing variables.");
