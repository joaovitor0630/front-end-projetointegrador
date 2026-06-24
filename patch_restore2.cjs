const fs = require('fs');
const path = 'c:/Users/carva/Desktop/codigo/Sinistro interface design/src/app/pages/Records.tsx';
let code = fs.readFileSync(path, 'utf8');

const missingVars = `
    const [result, setResult] = useState<"Aprovado" | "Reprovado" | "Aprovado com ressalvas" | "">(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.result || editing?.result || ""; } catch { return editing?.result || ""; }
    });
`;

code = code.replace(
  /const \[status, setStatus\] = useState\(\(\) => \{[\s\S]*?\}\);/,
  `$&${missingVars}`
);

code = code.replace(
  /kind, area, vistoriaAreas, inspectionDate, inspector, store, storeQuery, luc, subject, details, amount, taxonomy, taxonomyQuery, status, files/g,
  `kind, area, vistoriaAreas, inspectionDate, inspector, store, storeQuery, luc, subject, details, amount, taxonomy, taxonomyQuery, status, result, files`
);

fs.writeFileSync(path, code);
console.log("Restored result.");
