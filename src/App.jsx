import { useState } from "react";

const INDUSTRIES = {
  insurance: { label: "Versicherungen", icon: "🛡️", color: "#1A5276", desc: "Sach-, Lebens-, Krankenversicherung", country: "DE + CH" },
  banking: { label: "Banken", icon: "🏦", color: "#2C3E50", desc: "Banken, Asset Management, FinTech", country: "DE + CH" },
  healthcare: { label: "Gesundheitswesen", icon: "🏥", color: "#1ABC9C", desc: "Krankenkassen, Kliniken", country: "DE + CH" },
  automotive: { label: "Automotive", icon: "🚗", color: "#E74C3C", desc: "OEMs, Zulieferer, E-Mobility", country: "DE + CH" },
  manufacturing: { label: "Manufacturing", icon: "⚙️", color: "#E67E22", desc: "Maschinenbau, Anlagenbau", country: "DE + CH" },
  retail: { label: "Handel / Retail", icon: "🛒", color: "#27AE60", desc: "Einzelhandel, E-Commerce", country: "DE + CH" },
  energy: { label: "Energiewirtschaft", icon: "⚡", color: "#F39C12", desc: "Energieversorger, Stadtwerke", country: "DE + CH" },
  publicSector: { label: "Öffentliche Verwaltung", icon: "🏛️", color: "#2980B9", desc: "Behörden, Kommunen", country: "DE + CH" },
};

const SECTIONS = [
  { id: "general", title: "📋 Allgemeine Informationen", questions: [
    { q: "Kundenname", type: "text" }, { q: "Ansprechpartner", type: "text" }, { q: "E-Mail", type: "text" }, { q: "Berater (intern)", type: "text" }
  ]},
  { id: "landscape", title: "💻 SAP-Systemlandschaft", questions: [
    { q: "Welche SAP-Systeme setzen Sie ein?", hint: "z.B. S/4HANA, ECC" },
    { q: "SAP-Release-Version?", hint: "z.B. S/4HANA 2023" },
    { q: "On-Premise, Private oder Public Cloud?" },
    { q: "Welche Datenbank?", hint: "z.B. SAP HANA, Oracle" },
    { q: "Migration zu S/4HANA geplant?" },
    { q: "Clean-Core-Strategie?" }
  ]},
  { id: "btp", title: "☁️ SAP BTP", questions: [
    { q: "Nutzen Sie SAP BTP?", hint: "Ja / Nein / In Planung" },
    { q: "Welche BTP-Services?", hint: "AI Core, Datasphere, Integration Suite" },
    { q: "BTP-Lizenzmodell?", hint: "CPEA, BTPEA, Subscription" },
    { q: "SAP Datasphere im Einsatz?" }
  ]},
  { id: "aiSap", title: "🤖 KI im SAP-Umfeld", questions: [
    { q: "KI-Funktionen in SAP aktiv?", hint: "Intelligent RPA, Predictive Analytics" },
    { q: "SAP Joule aktiviert/geplant?" },
    { q: "SAP Signavio mit KI?" }
  ]},
  { id: "aiNonSap", title: "🧠 Non-SAP KI", questions: [
    { q: "Non-SAP KI-Tools?", hint: "Copilot, ChatGPT, Azure OpenAI" },
    { q: "Eigene ML-Modelle?", hint: "Databricks, Python/R" }
  ]},
  { id: "data", title: "📊 Datengrundlage", questions: [
    { q: "Datenqualität?", hint: "Sehr gut / Gut / Ausbaufähig" },
    { q: "Data Governance vorhanden?" },
    { q: "Zentrales DWH / Data Lake?" }
  ]},
  { id: "security", title: "🔐 Compliance", questions: [
    { q: "AI Policy vorhanden?" },
    { q: "DSGVO-Konformität bei KI?" },
    { q: "EU AI Act Anforderungen?" }
  ]},
  { id: "useCases", title: "🎯 Use Cases", questions: [
    { q: "KI-Use-Cases identifiziert?" },
    { q: "Größtes KI-Potenzial?" },
    { q: "Budget für KI?", hint: "<50k, 50-200k, 200k-1M, >1M" }
  ]}
];

function computeReadiness(answers) {
  const val = (sId, qi) => (answers[`${sId}_${qi}`] || "").toLowerCase();
  let sap = 20, btp = 10, data = 10;
  if (/s\/4|hana|rise/i.test(val("landscape",0)+val("landscape",1))) sap += 25;
  if (/cloud|public/i.test(val("landscape",2))) sap += 15;
  if (/hana/i.test(val("landscape",3))) sap += 10;
  if (/ja|yes/i.test(val("landscape",4))) sap += 10;
  if (/clean|ja|yes/i.test(val("landscape",5))) sap += 10;
  if (/ja|yes/i.test(val("aiSap",0))) sap += 10;
  if (/ja|yes/i.test(val("btp",0))) btp += 25;
  if (/ai.?core|datasphere/i.test(val("btp",1))) btp += 20;
  if (/cpea|btpea/i.test(val("btp",2))) btp += 15;
  if (/ja|yes/i.test(val("btp",3))) btp += 15;
  if (/sehr gut/i.test(val("data",0))) data += 35;
  else if (/gut/i.test(val("data",0))) data += 20;
  if (/ja|yes/i.test(val("data",1))) data += 25;
  if (/ja|yes|bw|lake/i.test(val("data",2))) data += 20;
  return { sap: Math.min(100,sap), btp: Math.min(100,btp), data: Math.min(100,data) };
}

const Gauge = ({ value, label }) => {
  const col = value >= 66 ? "#27AE60" : value >= 33 ? "#F39C12" : "#E74C3C";
  return (
    <div style={{textAlign:"center",flex:1,minWidth:150}}>
      <div style={{background:"#E8EDF2",borderRadius:10,height:20,overflow:"hidden",margin:"0 auto",maxWidth:180}}>
        <div style={{background:col,height:"100%",width:`${value}%`,borderRadius:10,transition:"width 0.5s"}}/>
      </div>
      <div style={{fontSize:18,fontWeight:800,color:col,marginTop:8}}>{value}%</div>
      <div style={{fontSize:12,fontWeight:600,color:"#1B3A5C"}}>{label}</div>
      <div style={{fontSize:10,color:col}}>{value >= 66 ? "AI-Ready ✓" : value >= 33 ? "Teilweise bereit" : "Nicht bereit"}</div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState("select");
  const [industry, setIndustry] = useState(null);
  const [answers, setAnswers] = useState({});
  const [section, setSection] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const ind = INDUSTRIES[industry];
  const totalQ = SECTIONS.reduce((s,sec) => s + sec.questions.length, 0);
  const answeredQ = Object.values(answers).filter(v => v?.trim()).length;
  const progress = totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0;

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Outfit',sans-serif;background:#F7F9FC}
    .card{transition:all .2s;cursor:pointer}.card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.1)!important}
    .btn{transition:all .2s;cursor:pointer}.btn:hover{transform:translateY(-2px)}
    textarea:focus,input:focus{outline:none;border-color:#2E86C1!important}
  `;

  if (step === "select") {
    return (
      <div style={{minHeight:"100vh",padding:"40px 24px"}}>
        <style>{styles}</style>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,#1B3A5C,#2E86C1)",padding:"10px 24px",borderRadius:40,marginBottom:20}}>
              <span style={{fontSize:22}}>🤖</span>
              <span style={{color:"#fff",fontWeight:700,fontSize:14,letterSpacing:2}}>ADESSO AI READINESS CHECK</span>
            </div>
            <h1 style={{fontSize:32,fontWeight:800,color:"#1B3A5C",marginBottom:12}}>Branchenspezifischer AI Readiness Check</h1>
            <p style={{fontSize:15,color:"#5D6D7E",maxWidth:600,margin:"0 auto"}}>Wählen Sie die Branche Ihres Kunden für einen maßgeschneiderten Fragebogen.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",gap:16,marginBottom:30}}>
            {Object.entries(INDUSTRIES).map(([key, i]) => (
              <div key={key} className="card" onClick={() => { setIndustry(key); setStep("fill"); }}
                style={{background:"#fff",borderRadius:14,padding:"20px",border:"2px solid #E8EDF2",boxShadow:"0 2px 8px rgba(0,0,0,.03)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{fontSize:28}}>{i.icon}</span>
                  <span style={{fontSize:10,background:"#E8F6F3",color:"#1ABC9C",padding:"3px 8px",borderRadius:4,fontWeight:700}}>{i.country}</span>
                </div>
                <h3 style={{fontSize:15,fontWeight:700,color:"#1B3A5C",marginBottom:4}}>{i.label}</h3>
                <p style={{fontSize:12,color:"#7F8C8D"}}>{i.desc}</p>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center"}}>
            <button className="btn" onClick={() => setStep("fill")} style={{background:"transparent",border:"2px dashed #BDC3C7",borderRadius:10,padding:"12px 28px",fontSize:14,color:"#7F8C8D"}}>
              Ohne Branchenauswahl fortfahren →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const rd = computeReadiness(answers);
    const overall = Math.round((rd.sap + rd.btp + rd.data) / 3);
    const oCol = overall >= 66 ? "#27AE60" : overall >= 33 ? "#F39C12" : "#E74C3C";
    return (
      <div style={{minHeight:"100vh",padding:"40px 24px"}}>
        <style>{styles}</style>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:30}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"linear-gradient(135deg,#27AE60,#1E8449)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff",marginBottom:12}}>✓</div>
            <h2 style={{fontSize:24,fontWeight:800,color:"#1B3A5C"}}>AI Readiness Ergebnis</h2>
            <p style={{color:"#7F8C8D",fontSize:13}}>{ind?.label || "Allgemein"} — {answeredQ}/{totalQ} Fragen beantwortet</p>
          </div>
          <div style={{background:"#fff",borderRadius:16,padding:30,marginBottom:24,border:"1px solid #E8EDF2"}}>
            <h3 style={{fontSize:16,fontWeight:700,color:"#1B3A5C",marginBottom:20,textAlign:"center"}}>🎯 AI Readiness Assessment</h3>
            <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",marginBottom:24}}>
              <Gauge value={rd.sap} label="SAP System"/>
              <Gauge value={rd.btp} label="BTP & AI Platform"/>
              <Gauge value={rd.data} label="Datenreife"/>
            </div>
            <div style={{textAlign:"center",padding:20,background:overall>=66?"#EAFAF1":overall>=33?"#FEF9E7":"#FDEDEC",borderRadius:12}}>
              <div style={{fontSize:12,color:"#5D6D7E"}}>Gesamtbewertung</div>
              <div style={{fontSize:32,fontWeight:800,color:oCol}}>{overall}%</div>
              <div style={{fontSize:12,color:oCol,fontWeight:600}}>
                {overall >= 66 ? "Gut für SAP Business AI aufgestellt" : overall >= 33 ? "Grundlagen vorhanden — Maßnahmen empfohlen" : "Erheblicher Handlungsbedarf"}
              </div>
            </div>
          </div>
          {SECTIONS.map(s => (
            <div key={s.id} style={{marginBottom:16,background:"#fff",borderRadius:12,border:"1px solid #E8EDF2",overflow:"hidden"}}>
              <div style={{padding:"12px 18px",background:"#FAFBFC",borderBottom:"1px solid #E8EDF2"}}>
                <h3 style={{fontSize:14,fontWeight:700,color:"#1B3A5C"}}>{s.title}</h3>
              </div>
              <div style={{padding:"12px 18px"}}>
                {s.questions.map((q,qi) => {
                  const ans = answers[`${s.id}_${qi}`];
                  return (
                    <div key={qi} style={{padding:"6px 0",borderBottom:qi<s.questions.length-1?"1px solid #F2F3F4":"none"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#1B3A5C"}}>{q.q}</div>
                      <div style={{fontSize:12,color:ans?.trim()?"#2C3E50":"#BDC3C7",fontStyle:ans?.trim()?"normal":"italic"}}>{ans?.trim()||"— nicht beantwortet —"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{textAlign:"center",marginTop:24}}>
            <button className="btn" onClick={() => setShowResult(false)} style={{background:"#fff",color:"#2E86C1",border:"2px solid #2E86C1",borderRadius:10,padding:"12px 28px",fontSize:14,fontWeight:600}}>
              ← Zurück zum Fragebogen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sec = SECTIONS[section];
  return (
    <div style={{minHeight:"100vh",display:"flex"}}>
      <style>{styles}</style>
      <div style={{width:260,background:"#fff",borderRight:"1px solid #E8EDF2",padding:"20px 0",flexShrink:0}}>
        <div style={{padding:"0 16px",marginBottom:20}}>
          <button onClick={() => setStep("select")} style={{background:"none",border:"none",color:"#2E86C1",fontSize:12,cursor:"pointer",marginBottom:10}}>← Zurück</button>
          {ind && <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:20}}>{ind.icon}</span>
            <span style={{fontSize:12,fontWeight:700,color:"#1B3A5C"}}>{ind.label}</span>
          </div>}
          <div style={{background:"#E8EDF2",borderRadius:5,height:8,marginBottom:6,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(90deg,#2E86C1,#27AE60)",height:"100%",width:`${progress}%`,transition:"width .5s"}}/>
          </div>
          <div style={{fontSize:11,color:"#7F8C8D"}}>{answeredQ}/{totalQ} beantwortet ({progress}%)</div>
        </div>
        {SECTIONS.map((s,i) => {
          const sAns = s.questions.filter((_,qi) => answers[`${s.id}_${qi}`]?.trim()).length;
          return (
            <div key={s.id} onClick={() => setSection(i)}
              style={{padding:"10px 16px",background:section===i?"#EBF5FB":"transparent",borderRight:section===i?"3px solid #2E86C1":"3px solid transparent",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,fontWeight:section===i?700:500,color:"#1B3A5C"}}>{s.title}</span>
              <span style={{fontSize:10,color:sAns===s.questions.length&&sAns>0?"#27AE60":"#95A5A6",fontWeight:600}}>{sAns}/{s.questions.length}</span>
            </div>
          );
        })}
        <div style={{padding:"16px"}}>
          <button className="btn" onClick={() => setShowResult(true)}
            style={{width:"100%",background:"linear-gradient(135deg,#1B3A5C,#2E86C1)",color:"#fff",border:"none",borderRadius:10,padding:12,fontSize:13,fontWeight:700}}>
            📄 Zusammenfassung
          </button>
        </div>
      </div>
      <div style={{flex:1,padding:"30px 40px",maxWidth:700}}>
        <div style={{marginBottom:24}}>
          <h2 style={{fontSize:20,fontWeight:800,color:"#1B3A5C"}}>{sec.title}</h2>
          <p style={{fontSize:12,color:"#95A5A6"}}>Abschnitt {section+1} von {SECTIONS.length}</p>
        </div>
        {sec.questions.map((q,qi) => (
          <div key={qi} style={{marginBottom:16,background:"#fff",borderRadius:12,padding:"18px 20px",border:"1px solid #E8EDF2"}}>
            <label style={{display:"block",fontSize:14,fontWeight:600,color:"#1B3A5C",marginBottom:4}}>{q.q}</label>
            {q.hint && <div style={{fontSize:11,color:"#95A5A6",marginBottom:8,fontStyle:"italic"}}>{q.hint}</div>}
            {q.type === "text" ? (
              <input type="text" value={answers[`${sec.id}_${qi}`] || ""} onChange={e => setAnswers(p => ({...p, [`${sec.id}_${qi}`]: e.target.value}))}
                style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid #D5D8DC",fontSize:13}}/>
            ) : (
              <textarea value={answers[`${sec.id}_${qi}`] || ""} onChange={e => setAnswers(p => ({...p, [`${sec.id}_${qi}`]: e.target.value}))} rows={3}
                style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid #D5D8DC",fontSize:13,resize:"vertical"}}/>
            )}
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:28}}>
          <button onClick={() => setSection(Math.max(0,section-1))} disabled={section===0}
            style={{background:section===0?"#E8EDF2":"#fff",color:section===0?"#BDC3C7":"#2E86C1",border:section===0?"none":"2px solid #2E86C1",borderRadius:10,padding:"10px 24px",fontSize:13,fontWeight:600,cursor:section===0?"default":"pointer"}}>
            ← Zurück
          </button>
          <button className="btn" onClick={() => setSection(Math.min(SECTIONS.length-1,section+1))} disabled={section===SECTIONS.length-1}
            style={{background:section===SECTIONS.length-1?"#E8EDF2":"linear-gradient(135deg,#1B3A5C,#2E86C1)",color:section===SECTIONS.length-1?"#BDC3C7":"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:13,fontWeight:600,cursor:section===SECTIONS.length-1?"default":"pointer"}}>
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
}