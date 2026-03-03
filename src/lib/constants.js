/* ═══════════════════════════════════════════════════════════════
   SHARED CONSTANTS FOR AI READINESS CHECK
   ═══════════════════════════════════════════════════════════════ */

/**
 * Complete adesso Industry Map (DE + CH)
 * Source: adesso.de/branchen + adesso.ch/branchen
 */
export const INDUSTRIES = {
  /* ── CORE adesso industries ────────────────────────────── */
  insurance: {
    label: "Versicherungen / Rückversicherungen",
    icon: "🛡️",
    color: "#1A5276",
    gradient: "linear-gradient(135deg, #1A5276 0%, #154360 100%)",
    desc: "Sach-, Lebens-, Kranken-, Rückversicherung — adesso Kernbranche mit in|sure Ecosphere",
    country: "DE + CH",
    priority: "core",
    specificQuestions: [
      { section: "SAP & Versicherungssysteme", questions: [
        { q: "Nutzen Sie SAP FS-CD (Collections & Disbursements) oder SAP FI-CA?", hint: "FS-CD = versicherungsspezifisches Nebenbuch; FI-CA = branchenübergreifend" },
        { q: "Ist SAP S/4HANA FPSL (Financial Products Subledger) im Einsatz?", hint: "Subledger für IFRS 17 / IFRS 9 Reporting" },
        { q: "Nutzen Sie adesso in|sure Ecosphere Produkte?", hint: "z. B. in|sure PSLife, in|sure Claims, in|sure Health Claims" },
        { q: "Welche Bestandsführungssysteme (Policy Administration) sind im Einsatz?", hint: "z. B. msg, Guidewire, in|sure, Eigenentwicklung" },
      ]},
      { section: "KI-spezifisch für Versicherungen", questions: [
        { q: "Setzen Sie KI für Schadenerkennung / Fraud Detection ein?", hint: "z. B. adesso a|advanced fraud management, SAS, eigene Modelle" },
        { q: "Gibt es KI-basierte Dunkelverarbeitung / Straight-Through Processing?", hint: "Automatische Schadenbearbeitung ohne manuelle Eingriffe" },
        { q: "Nutzen Sie KI für Underwriting / Risikoprüfung?", hint: "" },
        { q: "Gibt es KI-gestützte Tarifierung / Pricing-Modelle?", hint: "" },
        { q: "Setzen Sie KI-Chatbots oder virtuelle Assistenten im Kundenservice ein?", hint: "z. B. für Schadensmeldungen, Vertragsauskunft" },
        { q: "Nutzen Sie KI für Dokumentenanalyse / OCR bei der Schadenbearbeitung?", hint: "" },
        { q: "Werden Telematik-Daten (z. B. KFZ) für KI-Modelle genutzt?", hint: "" },
      ]},
      { section: "Regulatorik & Compliance", questions: [
        { q: "Welche Anforderungen aus Solvency II betreffen Ihren KI-Einsatz?", hint: "" },
        { q: "Wie gehen Sie mit der BaFin-Regulierung zu KI in Versicherungen um?", hint: "VAIT, MaGo, Erklärbarkeit" },
        { q: "Gibt es Anforderungen an Fairness / Bias-Prüfung bei KI-Modellen?", hint: "z. B. bei Tarifierung, Risikoselektion" },
      ]},
    ]
  },
  banking: {
    label: "Banken / Finanzdienstleistungen",
    icon: "🏦",
    color: "#2C3E50",
    gradient: "linear-gradient(135deg, #2C3E50 0%, #1A252F 100%)",
    desc: "Banken, Asset Management, FinTech, Zahlungsverkehr",
    country: "DE + CH",
    priority: "core",
    specificQuestions: [
      { section: "SAP-Systemlandschaft Banking", questions: [
        { q: "Nutzen Sie SAP S/4HANA FPSL (Financial Products Subledger)?", hint: "Nachfolger von SAP Bank Analyzer – Wartungsende Bank Analyzer 2025" },
        { q: "Ist SAP Payment Engine oder SAP Multi-Bank Connectivity (BTP) im Einsatz?", hint: "SAP Payment Engine = Zahlungsverkehrslösung für Banken" },
        { q: "Verwenden Sie SAP GRC (Governance, Risk and Compliance)?", hint: "Access Control, Process Control, Risk Management" },
      ]},
      { section: "KI-spezifisch für Banking", questions: [
        { q: "Setzen Sie KI für Fraud Detection / Anti-Money Laundering (AML) ein?", hint: "z. B. SAP, FICO, SAS, eigene Modelle" },
        { q: "Gibt es KI-basiertes Credit Scoring oder Risikobewertung?", hint: "" },
        { q: "Nutzen Sie KI im Bereich Regulatory Reporting oder Compliance?", hint: "" },
        { q: "Werden KI-Chatbots im Kundenservice / Beratung eingesetzt?", hint: "" },
        { q: "Setzen Sie KI für algorithmisches Trading oder Portfolio-Optimierung ein?", hint: "" },
        { q: "Nutzen Sie KI für die Analyse von Kundendaten (Next Best Action)?", hint: "" },
      ]},
      { section: "Regulatorik", questions: [
        { q: "Welche regulatorischen Anforderungen gelten für KI (BaFin/FINMA, EBA, MaRisk)?", hint: "Schweiz: FINMA-Rundschreiben, Deutschland: BaFin" },
        { q: "Gibt es Anforderungen an Erklärbarkeit (Explainable AI / XAI)?", hint: "" },
      ]},
    ]
  },
  healthcare: {
    label: "Gesundheitswesen / Health",
    icon: "🏥",
    color: "#1ABC9C",
    gradient: "linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)",
    desc: "Krankenkassen (GKV/PKV), Kliniken, Kassenärztliche Vereinigungen, Abrechnungszentren",
    country: "DE + CH",
    priority: "core",
    specificQuestions: [
      { section: "SAP & Gesundheitssysteme", questions: [
        { q: "Nutzen Sie SAP IS-H (Industry Solution for Healthcare)?", hint: "Patientenmanagement, Aufnahme/Entlassung, Abrechnung, DRG" },
        { q: "Welches KIS (Krankenhausinformationssystem) ist im Einsatz?", hint: "z. B. SAP IS-H mit i.s.h.med, Cerner, Dedalus ORBIS, Meierhofer" },
        { q: "Nutzen Sie SAP-Branchenlösungen für Krankenversicherungen?", hint: "z. B. FI-CA für Beitragsabrechnung, Leistungsmanagement" },
        { q: "Setzen Sie oscare® oder andere GKV-spezifische Branchenlösungen ein?", hint: "oscare® = AOK-Systems-Lösung auf SAP-Basis" },
      ]},
      { section: "KI-spezifisch für Gesundheitswesen", questions: [
        { q: "Nutzen Sie KI für Leistungsprüfung / Abrechnungsanalyse?", hint: "z. B. Betrugserkennung, Plausibilitätsprüfung" },
        { q: "Gibt es KI-basierte Anwendungen in der Patientenversorgung?", hint: "z. B. Diagnoseunterstützung, Triage, Bildanalyse" },
        { q: "Setzen Sie KI im Bereich Datenmanagement (Gesundheitsdatennutzungsgesetz) ein?", hint: "" },
        { q: "Nutzen Sie GenAI für Dokumentation, Arztbriefe oder Kodierung?", hint: "z. B. ICD/OPS-Kodierung, Befundtexte" },
        { q: "Gibt es KI-Projekte zur Versorgungssteuerung / Population Health Management?", hint: "" },
      ]},
      { section: "Compliance & Regulatorik", questions: [
        { q: "Wie gehen Sie mit der TI (Telematikinfrastruktur) und ePA um?", hint: "Schweiz: EPD (Elektronisches Patientendossier)" },
        { q: "Welche DiGA / DTx (Digitale Gesundheitsanwendungen) Anforderungen bestehen?", hint: "" },
        { q: "Wie wird Datenschutz im Gesundheitskontext (§ 203 StGB, DSGVO) sichergestellt?", hint: "Schweiz: DSG, Patientengeheimnis" },
      ]},
    ]
  },
  automotive: {
    label: "Automobil / Automotive",
    icon: "🚗",
    color: "#E74C3C",
    gradient: "linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)",
    desc: "OEMs, Zulieferer, Mobilität, E-Mobility, Connected Car",
    country: "DE + CH",
    priority: "core",
    specificQuestions: [
      { section: "SAP-Systemlandschaft Automotive", questions: [
        { q: "Nutzen Sie SAP S/4HANA mit dem Vehicle Management System (VMS)?", hint: "SAP VMS (IS-A-VMS) ist die Branchenlösung für Fahrzeugvertrieb und -management" },
        { q: "Ist SAP Digital Manufacturing (DM) oder SAP Manufacturing Execution (ME) im Einsatz?", hint: "" },
        { q: "Verwenden Sie SAP Integrated Business Planning (IBP) für Supply Chain Planning?", hint: "Nachfolger von SAP APO" },
      ]},
      { section: "KI-spezifisch für Automotive", questions: [
        { q: "Setzen Sie KI in der Qualitätssicherung ein (Visual Inspection, SPC)?", hint: "" },
        { q: "Gibt es KI-basierte Predictive Maintenance für Produktionsanlagen?", hint: "" },
        { q: "Nutzen Sie KI für Supply Chain Risk Management / Engpassvorhersage?", hint: "" },
        { q: "Werden KI-Modelle für Demand Forecasting im Aftersales eingesetzt?", hint: "" },
        { q: "Gibt es KI-Anwendungen im Bereich Connected Car / Telematik?", hint: "" },
        { q: "Nutzen Sie KI für Variantenkonfiguration oder Engineering?", hint: "" },
      ]},
      { section: "Daten & Integration", questions: [
        { q: "Sind Sie an Catena-X / Manufacturing-X angebunden?", hint: "" },
        { q: "Wie werden IoT-Daten (Shopfloor, Maschinen, Fahrzeuge) gesammelt?", hint: "" },
      ]},
    ]
  },
  manufacturing: {
    label: "Manufacturing Industry",
    icon: "⚙️",
    color: "#E67E22",
    gradient: "linear-gradient(135deg, #E67E22 0%, #D35400 100%)",
    desc: "Maschinenbau, Anlagenbau, Elektronik, Fertigungsindustrie",
    country: "DE + CH",
    priority: "core",
    specificQuestions: [
      { section: "SAP-Systemlandschaft Fertigung", questions: [
        { q: "Nutzen Sie SAP Digital Manufacturing (DM) oder SAP Manufacturing Execution (ME)?", hint: "SAP DM = Cloud-Lösung; SAP ME = On-Premise MES" },
        { q: "Ist SAP PP/DS oder SAP Integrated Business Planning (IBP) im Einsatz?", hint: "PP/DS = embedded in S/4HANA; IBP = Cloud-basierte Planung" },
        { q: "Verwenden Sie SAP Plant Maintenance (PM) bzw. S/4HANA Asset Management?", hint: "PM = klassisches Modul; EAM = S/4HANA-Bezeichnung" },
      ]},
      { section: "KI-spezifisch für Fertigung", questions: [
        { q: "Setzen Sie Predictive Maintenance oder Condition Monitoring ein?", hint: "z. B. SAP Asset Performance Management (APM), Azure IoT, eigene ML-Modelle" },
        { q: "Gibt es KI-basierte Qualitätsprüfung (Visual Inspection, Anomaly Detection)?", hint: "" },
        { q: "Nutzen Sie KI für Demand Forecasting / Supply Chain Optimization?", hint: "" },
        { q: "Werden Digital Twins oder Simulationsmodelle eingesetzt?", hint: "" },
        { q: "Gibt es IoT-/Sensorik-Daten für KI-Anwendungen?", hint: "OPC UA, MQTT, Shopfloor-Daten" },
      ]},
      { section: "Daten & Integration", questions: [
        { q: "Wie werden Maschinendaten aktuell erfasst und verarbeitet?", hint: "" },
        { q: "Gibt es eine Integration zwischen MES und SAP ERP?", hint: "" },
      ]},
    ]
  },
  retail: {
    label: "Handel / Retail",
    icon: "🛒",
    color: "#27AE60",
    gradient: "linear-gradient(135deg, #27AE60 0%, #1E8449 100%)",
    desc: "Einzelhandel, E-Commerce, Großhandel, Fashion",
    country: "DE + CH",
    priority: "core",
    specificQuestions: [
      { section: "SAP-Systemlandschaft Handel", questions: [
        { q: "Nutzen Sie SAP Customer Activity Repository (CAR)?", hint: "Zentrale Plattform für POS-Daten, Omnichannel-Analytics, Demand Forecasting" },
        { q: "Ist SAP Commerce Cloud oder SAP Emarsys Customer Engagement im Einsatz?", hint: "Commerce Cloud = E-Commerce-Plattform; Emarsys = Marketing Automation" },
        { q: "Verwenden Sie SAP S/4HANA Retail (Merchandise Mgmt, Allocation)?", hint: "Nachfolger von SAP Retail (IS-R)" },
      ]},
      { section: "KI-spezifisch für Handel", questions: [
        { q: "Setzen Sie KI-basierte Personalisierung im E-Commerce ein?", hint: "Produktempfehlungen, Dynamic Pricing" },
        { q: "Nutzen Sie KI für Demand Forecasting / Bestandsoptimierung?", hint: "" },
        { q: "Gibt es KI-gestützte Preisoptimierung (Dynamic Pricing)?", hint: "" },
        { q: "Werden Chatbots / KI-Assistenten im Kundenservice eingesetzt?", hint: "" },
        { q: "Nutzen Sie Sentiment-Analyse oder Customer Journey Analytics?", hint: "" },
      ]},
      { section: "Daten & Omnichannel", questions: [
        { q: "Wie werden Omnichannel-Daten (POS, Online, Mobile) zusammengeführt?", hint: "" },
        { q: "Gibt es ein CDP oder einheitliches Kundenprofil?", hint: "" },
      ]},
    ]
  },
  energy: {
    label: "Energiewirtschaft / Utilities",
    icon: "⚡",
    color: "#F39C12",
    gradient: "linear-gradient(135deg, #F39C12 0%, #E67E22 100%)",
    desc: "Energieversorger, Stadtwerke, Öl & Gas, Erneuerbare",
    country: "DE + CH",
    priority: "core",
    specificQuestions: [
      { section: "SAP-Systemlandschaft Energie", questions: [
        { q: "Nutzen Sie SAP IS-U oder bereits SAP S/4HANA Utilities?", hint: "IS-U Wartungsende unter SAP ERP: Ende 2027; Nachfolger: S/4HANA Utilities" },
        { q: "Ist SAP Asset Performance Management (APM) im Einsatz?", hint: "SAP APM = SaaS-Lösung für Predictive Maintenance und Condition Monitoring" },
        { q: "Verwenden Sie SAP für Billing / Meter Data Management?", hint: "" },
      ]},
      { section: "KI-spezifisch für Energie", questions: [
        { q: "Setzen Sie KI für Lastprognose (Load Forecasting) ein?", hint: "" },
        { q: "Gibt es Predictive Maintenance für Netz-Infrastruktur?", hint: "" },
        { q: "Nutzen Sie KI für Energiehandel oder Preisoptimierung?", hint: "" },
        { q: "Werden Smart-Meter-Daten mit KI analysiert?", hint: "" },
        { q: "Gibt es KI-basierte Grid Optimization oder Demand Response?", hint: "" },
      ]},
      { section: "Daten & OT-Integration", questions: [
        { q: "Wie werden IoT-/SCADA-Daten verarbeitet und gespeichert?", hint: "" },
        { q: "Gibt es eine Integration zwischen OT und IT/SAP?", hint: "" },
      ]},
    ]
  },
  publicSector: {
    label: "Öffentliche Verwaltung / Public",
    icon: "🏛️",
    color: "#2980B9",
    gradient: "linear-gradient(135deg, #2980B9 0%, #1F6DA0 100%)",
    desc: "Behörden, Kommunen, Bildung, Bundesverwaltung",
    country: "DE + CH",
    priority: "core",
    specificQuestions: [
      { section: "SAP-Systemlandschaft Public", questions: [
        { q: "Nutzen Sie SAP IS-PS (Public Sector) bzw. S/4HANA Public Sector Management?", hint: "Haushaltsmanagement (PSM), Fonds- und Zuwendungsmanagement" },
        { q: "Ist SAP PSCD (Public Sector Collections & Disbursements) im Einsatz?", hint: "Steuer-/Gebührenerhebung, Auszahlungen" },
        { q: "Verwenden Sie SAP SuccessFactors oder SAP HCM für Personal?", hint: "" },
      ]},
      { section: "KI-spezifisch für Öffentlichen Sektor", questions: [
        { q: "Gibt es KI-Pilotprojekte für Bürgerservices (Chatbots, Anträge)?", hint: "" },
        { q: "Setzen Sie KI für Dokumentenanalyse / Aktenbearbeitung ein?", hint: "" },
        { q: "Nutzen Sie KI-basierte Betrugserkennung?", hint: "" },
        { q: "Gibt es KI-gestützte Ressourcenplanung / Budgetoptimierung?", hint: "" },
      ]},
      { section: "Souveränität & Compliance", questions: [
        { q: "Welche Vorgaben gelten bzgl. digitaler Souveränität?", hint: "DE: BSI, IT-Grundschutz, Delos Cloud / CH: Swiss Government Cloud" },
        { q: "Wie wird der EU AI Act umgesetzt (Hochrisiko-KI)?", hint: "" },
      ]},
    ]
  },
  lifeSciences: {
    label: "Life Sciences / Pharma",
    icon: "💊",
    color: "#8E44AD",
    gradient: "linear-gradient(135deg, #8E44AD 0%, #6C3483 100%)",
    desc: "Pharma, Medizintechnik, Biotech, Chemie",
    country: "DE + CH",
    priority: "core",
    specificQuestions: [
      { section: "SAP-Systemlandschaft Life Sciences", questions: [
        { q: "Nutzen Sie SAP S/4HANA mit branchenspezifischen Life-Sciences-Funktionen?", hint: "z. B. Chargenrückverfolgung, Serialisierung, GMP-Prozesse" },
        { q: "Ist SAP EHS Management (Environment, Health & Safety) im Einsatz?", hint: "Gefahrstoffmanagement, Arbeitssicherheit" },
        { q: "Nutzen Sie SAP Advanced Track and Trace for Pharmaceuticals (ATTP)?", hint: "Serialisierung gemäß EU FMD / US DSCSA" },
      ]},
      { section: "KI-spezifisch für Life Sciences", questions: [
        { q: "Setzen Sie KI in der Forschung & Entwicklung ein?", hint: "Drug Discovery, Molecular Design" },
        { q: "Gibt es KI-basierte Qualitätskontrolle in der Produktion?", hint: "PAT, Visual Inspection" },
        { q: "Nutzen Sie KI für klinische Studien?", hint: "Patient Matching, Adverse Event Detection" },
        { q: "Werden KI-Modelle für Supply Chain / Cold Chain eingesetzt?", hint: "" },
      ]},
      { section: "Validierung & Compliance", questions: [
        { q: "Wie gehen Sie mit GxP-Validierung von KI-Systemen um?", hint: "CSV/CSA" },
        { q: "Welche FDA/EMA/Swissmedic-Anforderungen gelten?", hint: "" },
      ]},
    ]
  },
  /* ── IMPORTANT adesso industries ───────────────────────── */
  lottery: {
    label: "Lotteriegesellschaften / Gaming",
    icon: "🎰",
    color: "#D4AC0D",
    gradient: "linear-gradient(135deg, #D4AC0D 0%, #B7950B 100%)",
    desc: "Staatliche Lotterien, Sportwetten, Glücksspiel — adesso 20+ Jahre Expertise",
    country: "DE",
    priority: "important",
    specificQuestions: [
      { section: "IT-Systeme Lotterie", questions: [
        { q: "Welche Lotterie-Kernsysteme (Gaming Platform) sind im Einsatz?", hint: "z. B. adesso-Lösungen, IGT, Scientific Games, Eigenentwicklung" },
        { q: "Nutzen Sie SAP als ERP-System für die Lotteriegesellschaft?", hint: "" },
        { q: "Welche Online-/Mobile-Spielplattformen betreiben Sie?", hint: "" },
      ]},
      { section: "KI-spezifisch für Lotterie", questions: [
        { q: "Setzen Sie KI für Spielerschutz / Responsible Gaming ein?", hint: "z. B. Erkennung von problematischem Spielverhalten" },
        { q: "Nutzen Sie KI-basierte Betrugs- und Manipulationserkennung?", hint: "" },
        { q: "Gibt es KI für Kundenanalyse / Personalisierung?", hint: "z. B. Spielerprofile, Angebotsoptimierung" },
        { q: "Setzen Sie KI für Spielscheinerkennung (OCR/Vision) ein?", hint: "z. B. adesso KI-basierte Spielscheinerkennung" },
        { q: "Werden KI-Chatbots für den Kundenservice genutzt?", hint: "" },
      ]},
      { section: "Sicherheit & Regulatorik", questions: [
        { q: "Sind Sie nach WLA-SCS zertifiziert?", hint: "World Lottery Association Security Control Standard" },
        { q: "Welche regulatorischen Anforderungen gelten (GlüStV, Landesrecht)?", hint: "" },
      ]},
    ]
  },
  transport: {
    label: "Verkehrsbetriebe & Logistik",
    icon: "🚆",
    color: "#3498DB",
    gradient: "linear-gradient(135deg, #3498DB 0%, #2471A3 100%)",
    desc: "ÖPNV, Bahn, Logistik, Mobility as a Service",
    country: "DE + CH",
    priority: "important",
    specificQuestions: [
      { section: "SAP & Verkehrssysteme", questions: [
        { q: "Nutzen Sie SAP Transportation Management (SAP TM)?", hint: "Integriert in S/4HANA für Transportplanung und -ausführung" },
        { q: "Ist SAP EAM (Enterprise Asset Management) / PM für Fahrzeugflotten im Einsatz?", hint: "Instandhaltungsplanung, Wartungszyklen" },
        { q: "Verwenden Sie SAP HCM oder SuccessFactors für Personalplanung?", hint: "z. B. Schichtplanung, Einsatzplanung" },
      ]},
      { section: "KI-spezifisch für Verkehr & Logistik", questions: [
        { q: "Setzen Sie KI für Fahrplanoptimierung / Routenplanung ein?", hint: "" },
        { q: "Gibt es Predictive Maintenance für Fahrzeugflotten?", hint: "" },
        { q: "Nutzen Sie KI für Fahrgastprognosen / Demand-Planung?", hint: "" },
        { q: "Werden KI-Chatbots für Kundenservice eingesetzt?", hint: "z. B. Fahrauskunft, Störungsmeldungen" },
        { q: "Gibt es KI-basierte Anomalieerkennung im Betrieb?", hint: "z. B. Verspätungsanalyse, Störungsprognose" },
      ]},
      { section: "Daten & IoT", questions: [
        { q: "Wie werden Echtzeit-Betriebsdaten erfasst (ITCS, Telematik)?", hint: "" },
        { q: "Gibt es eine Datenstrategie für Mobility Data / MaaS?", hint: "" },
      ]},
    ]
  },
  media: {
    label: "Medien & Entertainment",
    icon: "🎬",
    color: "#9B59B6",
    gradient: "linear-gradient(135deg, #9B59B6 0%, #7D3C98 100%)",
    desc: "Verlage, Rundfunk, Streaming, Gaming, Digitale Medien",
    country: "DE + CH",
    priority: "important",
    specificQuestions: [
      { section: "SAP & Mediensysteme", questions: [
        { q: "Nutzen Sie SAP als ERP-System?", hint: "" },
        { q: "Welche Content-Management- oder Publishing-Systeme sind im Einsatz?", hint: "" },
      ]},
      { section: "KI-spezifisch für Medien", questions: [
        { q: "Setzen Sie KI für Content-Erstellung / GenAI ein?", hint: "z. B. automatische Texterstellung, Bildgenerierung" },
        { q: "Nutzen Sie KI für Personalisierung / Recommendation Engines?", hint: "" },
        { q: "Gibt es KI-basierte Werbe-Optimierung (Ad Tech)?", hint: "Programmatic, Targeting" },
        { q: "Werden KI-Tools für Medienanalyse / Monitoring eingesetzt?", hint: "" },
        { q: "Nutzen Sie KI für Automatisierung redaktioneller Workflows?", hint: "" },
      ]},
    ]
  },
  defense: {
    label: "Defense / Verteidigung",
    icon: "🎖️",
    color: "#566573",
    gradient: "linear-gradient(135deg, #566573 0%, #2C3E50 100%)",
    desc: "Streitkräfte, Rüstungsindustrie, Sicherheitsbehörden",
    country: "DE",
    priority: "important",
    specificQuestions: [
      { section: "SAP Defense-Systeme", questions: [
        { q: "Nutzen Sie SAP S/4HANA Defense & Security (D&S)?", hint: "Nachfolger der ehemaligen DFPS-Lösung, seit S/4HANA 1909" },
        { q: "Welche SAP-Module setzen Sie im Verteidigungs-Kontext ein?", hint: "z. B. Materialwirtschaft (MM), Instandhaltung (PM/EAM), Personalwirtschaft (HCM), Finanzen (FI/CO)" },
        { q: "Nutzen Sie SASPF (die SAP-basierte ERP-Implementierung der Bundeswehr)?", hint: "SASPF = Standard-Anwendungssoftware-Produkt-Familie der Bundeswehr" },
      ]},
      { section: "KI-spezifisch für Defense", questions: [
        { q: "Setzen Sie KI für Predictive Maintenance von Waffensystemen/Fahrzeugen ein?", hint: "z. B. über SAP APM oder eigene ML-Modelle" },
        { q: "Gibt es KI-basierte Logistik-/Supply-Chain-Optimierung im Einsatz?", hint: "z. B. Ersatzteilprognose, Bestandsoptimierung" },
        { q: "Nutzen Sie KI für Lagebildanalyse / Informationsauswertung?", hint: "" },
        { q: "Werden KI-Modelle für Personal- oder Einsatzplanung genutzt?", hint: "" },
      ]},
      { section: "Sicherheit & Souveränität", questions: [
        { q: "Welche Geheimhaltungsstufen gelten für Ihre IT-Systeme?", hint: "VS-NfD, VS-Vertraulich, Geheim, Streng Geheim" },
        { q: "Welche Anforderungen an IT-Souveränität und Betriebsort bestehen?", hint: "z. B. Betrieb ausschließlich in DE, keine Public-Cloud-Dienste mit US-Jurisdiktion" },
      ]},
    ]
  },
  /* ── NICHE adesso industries ──────────────────────────── */
  foodBeverage: {
    label: "Food & Beverage",
    icon: "🍽️",
    color: "#E74C3C",
    gradient: "linear-gradient(135deg, #D35400 0%, #E74C3C 100%)",
    desc: "Nahrungs- und Genussmittelindustrie, Lebensmittelproduktion",
    country: "DE",
    priority: "niche",
    specificQuestions: [
      { section: "KI-spezifisch für Food & Beverage", questions: [
        { q: "Setzen Sie KI für Demand Forecasting / Absatzplanung ein?", hint: "Besonders relevant wegen Verderblichkeit" },
        { q: "Gibt es KI-basierte Qualitätskontrolle in der Produktion?", hint: "z. B. Visual Inspection, Sensorik" },
        { q: "Nutzen Sie KI für Supply Chain Optimization (Frische-Logistik)?", hint: "" },
        { q: "Werden KI-Modelle für Rezeptoptimierung / Produktentwicklung genutzt?", hint: "" },
        { q: "Gibt es KI-Anwendungen für Rückverfolgbarkeit / Track & Trace?", hint: "EU-Verordnung, Rückrufmanagement" },
      ]},
    ]
  },
  construction: {
    label: "Bauen und Wohnen",
    icon: "🏗️",
    color: "#DC7633",
    gradient: "linear-gradient(135deg, #DC7633 0%, #BA4A00 100%)",
    desc: "Bauunternehmen, Immobilien, Wohnungswirtschaft, PropTech",
    country: "DE",
    priority: "niche",
    specificQuestions: [
      { section: "KI-spezifisch für Bau & Immobilien", questions: [
        { q: "Nutzen Sie BIM (Building Information Modeling) mit KI-Unterstützung?", hint: "" },
        { q: "Setzen Sie KI für Projektplanung / Kostenprognose ein?", hint: "" },
        { q: "Gibt es KI-basierte Energieoptimierung von Gebäuden?", hint: "Smart Building, Predictive Energy Management" },
        { q: "Nutzen Sie KI für die Immobilienbewertung / Marktanalyse?", hint: "" },
        { q: "Setzen Sie KI im Facility Management ein?", hint: "Predictive Maintenance, Raumbelegung" },
      ]},
    ]
  },
  tradeFairsSports: {
    label: "Messegesellschaften & Sports",
    icon: "🏟️",
    color: "#16A085",
    gradient: "linear-gradient(135deg, #16A085 0%, #1ABC9C 100%)",
    desc: "Messegesellschaften, Sportvereine, Veranstaltungen, Events",
    country: "DE + CH",
    priority: "niche",
    specificQuestions: [
      { section: "KI-spezifisch für Events & Sports", questions: [
        { q: "Setzen Sie KI für Besucherprognosen / Kapazitätsplanung ein?", hint: "" },
        { q: "Nutzen Sie KI für Personalisierung im Ticketing / CRM?", hint: "" },
        { q: "Gibt es KI-basierte Matchday-Optimierung oder Fan-Engagement?", hint: "" },
        { q: "Werden KI-Modelle für Revenue Management eingesetzt?", hint: "z. B. dynamische Preisgestaltung für Standflächen oder Tickets" },
        { q: "Nutzen Sie KI für die Auswertung von Event-Daten / Analytics?", hint: "" },
      ]},
    ]
  },
  telecom: {
    label: "Telecom",
    icon: "📡",
    color: "#2980B9",
    gradient: "linear-gradient(135deg, #2980B9 0%, #3498DB 100%)",
    desc: "Telekommunikation, Netzbetreiber, ISPs — primär Schweiz",
    country: "CH",
    priority: "niche",
    specificQuestions: [
      { section: "KI-spezifisch für Telekommunikation", questions: [
        { q: "Setzen Sie KI für Network Performance Monitoring / Optimierung ein?", hint: "" },
        { q: "Gibt es KI-basierte Predictive Maintenance für Netzinfrastruktur?", hint: "" },
        { q: "Nutzen Sie KI für Churn Prediction / Kundenbindung?", hint: "" },
        { q: "Werden KI-Chatbots im Kundenservice eingesetzt?", hint: "" },
        { q: "Gibt es KI-gestützte Anomalieerkennung / Fraud Detection?", hint: "" },
        { q: "Nutzen Sie KI für die Netzplanung (5G Rollout, Kapazität)?", hint: "" },
      ]},
    ]
  },
  professionalServices: {
    label: "Professional Services",
    icon: "💼",
    color: "#7D3C98",
    gradient: "linear-gradient(135deg, #7D3C98 0%, #6C3483 100%)",
    desc: "Beratung, Wirtschaftsprüfung, Rechtsberatung, IT-Dienstleistungen — adesso bc Fokusbranche",
    country: "DE + CH",
    priority: "important",
    specificQuestions: [
      { section: "SAP-Systemlandschaft Professional Services", questions: [
        { q: "Nutzen Sie SAP S/4HANA Cloud (Public oder Private Edition)?", hint: "Public Edition = SaaS; Private Edition = managed Cloud" },
        { q: "Ist SAP Professional Services Cloud oder SAP PS (Projektsystem) im Einsatz?", hint: "Projektplanung, Zeitrückmeldung, Fakturierung" },
        { q: "Verwenden Sie SAP SuccessFactors für Talent Management?", hint: "Recruiting, Learning, Performance, Employee Central" },
      ]},
      { section: "KI-spezifisch für Professional Services", questions: [
        { q: "Setzen Sie KI für Ressourcenplanung / Skill-basiertes Staffing ein?", hint: "" },
        { q: "Nutzen Sie KI für Projektprognosen (Budget, Zeitpläne, Risiken)?", hint: "" },
        { q: "Gibt es KI-basierte Angebotsoptimierung / Pricing?", hint: "" },
        { q: "Setzen Sie GenAI für Dokumentenerstellung oder Wissensmanagement ein?", hint: "z. B. Angebotserstellung, Vertragstexte, interne Wissensdatenbank" },
        { q: "Nutzen Sie KI für Zeiterfassung oder Automatisierung administrativer Prozesse?", hint: "" },
      ]},
    ]
  },
  chemical: {
    label: "Chemie / Process Industries",
    icon: "🧪",
    color: "#117A65",
    gradient: "linear-gradient(135deg, #117A65 0%, #0E6655 100%)",
    desc: "Chemie, Prozessindustrie, Grundstoffe — adesso bc SAP Diamond Partner",
    country: "DE + CH",
    priority: "important",
    specificQuestions: [
      { section: "SAP-Systemlandschaft Chemie", questions: [
        { q: "Nutzen Sie SAP S/4HANA mit Prozessfertigung (PP-PI)?", hint: "Rezepturverwaltung, Chargenmanagement, Prozessaufträge" },
        { q: "Ist SAP EHS Management (Environment, Health & Safety) im Einsatz?", hint: "Gefahrstoffmanagement, SDB-Erstellung, Arbeitssicherheit" },
        { q: "Verwenden Sie SAP Responsible Design and Production?", hint: "Nachhaltigkeitsreporting, Circular Economy, Carbon Footprint" },
      ]},
      { section: "KI-spezifisch für Chemie / Prozessindustrie", questions: [
        { q: "Setzen Sie KI für Prozessoptimierung in der Produktion ein?", hint: "z. B. Yield Optimization, Rezepturoptimierung" },
        { q: "Gibt es KI-basierte Predictive Maintenance für Produktionsanlagen?", hint: "" },
        { q: "Nutzen Sie KI für Demand Forecasting / S&OP?", hint: "" },
        { q: "Werden KI-Modelle für Qualitätssicherung / Labor (LIMS-Integration) eingesetzt?", hint: "" },
        { q: "Gibt es KI-Anwendungen für ESG-Reporting oder Emissionsmanagement?", hint: "" },
      ]},
    ]
  },
};

/**
 * Core assessment sections (non-industry-specific)
 */
export const CORE_SECTIONS = [
  {
    id: "general",
    title: "📋 Allgemeine Informationen",
    questions: [
      { q: "Kundenname", hint: "", type: "text" },
      { q: "Ansprechpartner", hint: "", type: "text" },
      { q: "E-Mail", hint: "", type: "text" },
      { q: "Berater (intern)", hint: "", type: "text" },
    ]
  },
  {
    id: "landscape",
    title: "💻 SAP-Systemlandschaft",
    questions: [
      { q: "Welche SAP-Systeme setzen Sie aktuell ein?", hint: "z. B. S/4HANA, ECC, BW/4HANA, SuccessFactors, Ariba, CX" },
      { q: "Welche SAP-Release-Version nutzen Sie?", hint: "z. B. S/4HANA 2023 FPS02, ECC 6.0 EHP8" },
      { q: "On-Premise, Private Cloud oder Public Cloud (RISE/GROW)?", hint: "" },
      { q: "Welche Datenbank setzen Sie ein?", hint: "z. B. SAP HANA, HANA Cloud, Oracle, SQL Server" },
      { q: "Planen Sie eine Migration zu S/4HANA oder RISE with SAP?", hint: "" },
      { q: "Verfolgen Sie eine Clean-Core-Strategie?", hint: "Clean Core = Minimierung von Z-/Y-Custom Code zugunsten von BTP-Extensions und Standard" },
    ]
  },
  {
    id: "licensing",
    title: "📝 Lizenzierung",
    questions: [
      { q: "Welche SAP-Lizenzmodelle haben Sie?", hint: "Named User, Digital Access, Engine-based" },
      { q: "Verfügen Sie über SAP AI-spezifische Lizenzen?", hint: "SAP Business AI (inkl. Joule), SAP AI Core, SAP AI Launchpad" },
      { q: "Haben Sie Zugang zu SAP AI Core / AI Launchpad?", hint: "" },
      { q: "Lizenzierungen für SAP Analytics Cloud?", hint: "Planning, BI, oder beides?" },
    ]
  },
  {
    id: "btp",
    title: "☁️ SAP BTP",
    questions: [
      { q: "Nutzen Sie SAP BTP?", hint: "Ja / Nein / In Planung" },
      { q: "Welche BTP-Services sind im Einsatz?", hint: "Integration Suite, AI Core, Datasphere, Build Apps" },
      { q: "BTP-Lizenzmodell?", hint: "CPEA (Cloud Platform Enterprise Agreement), Subscription, BTPEA" },
      { q: "Nutzen Sie SAP Datasphere?", hint: "Nachfolger von SAP Data Warehouse Cloud und SAP Data Intelligence" },
      { q: "Ist SAP Business Data Cloud (BDC) im Einsatz oder geplant?", hint: "Managed SaaS für SAP-Datenstandardisierung — Basis für SAP Business AI" },
    ]
  },
  {
    id: "cloud",
    title: "🌐 Cloud & Integration",
    questions: [
      { q: "Welche SAP Cloud-Produkte nutzen Sie?", hint: "SuccessFactors, S/4HANA Cloud, Ariba, Concur, SAC" },
      { q: "Welche Hyperscaler nutzen Sie?", hint: "AWS, Azure, GCP" },
      { q: "Cloud-Strategie?", hint: "Cloud-first, Hybrid, Multi-Cloud?" },
    ]
  },
  {
    id: "aiSap",
    title: "🤖 KI im SAP-Umfeld",
    questions: [
      { q: "Nutzen Sie bereits KI-Funktionen innerhalb von SAP?", hint: "Intelligent RPA, Predictive Analytics, Cash Application" },
      { q: "Ist SAP Joule aktiviert oder geplant?", hint: "" },
      { q: "SAP Signavio mit KI-Funktionen?", hint: "" },
    ]
  },
  {
    id: "aiNonSap",
    title: "🧠 Non-SAP KI",
    questions: [
      { q: "Welche Non-SAP KI-Tools setzen Sie ein?", hint: "Microsoft Copilot, ChatGPT, Azure OpenAI, AWS Bedrock" },
      { q: "Eigene ML-Modelle / Data-Science-Plattformen?", hint: "Databricks, Python/R, Snowflake" },
      { q: "Low-Code/No-Code KI-Tools?", hint: "Power Platform AI Builder, UiPath" },
    ]
  },
  {
    id: "data",
    title: "📊 Datengrundlage",
    questions: [
      { q: "Qualität Ihrer Stamm- und Bewegungsdaten?", hint: "Sehr gut / Gut / Ausbaufähig / Kritisch" },
      { q: "Datenstrategie / Data Governance vorhanden?", hint: "" },
      { q: "Zentrales Data Warehouse / Data Lake?", hint: "" },
    ]
  },
  {
    id: "security",
    title: "🔐 Compliance & Governance",
    questions: [
      { q: "KI-Richtlinie (AI Policy) vorhanden?", hint: "" },
      { q: "DSGVO im Kontext von KI?", hint: "Schweiz: DSG" },
      { q: "Anforderungen EU AI Act?", hint: "" },
      { q: "Dürfen Daten in externen KI-Diensten verarbeitet werden?", hint: "" },
    ]
  },
  {
    id: "org",
    title: "👥 Organisation & Kompetenzen",
    questions: [
      { q: "Dediziertes KI-/Data-Science-Team?", hint: "" },
      { q: "Wer treibt KI strategisch voran?", hint: "CIO, CDO, Innovation Team" },
      { q: "KI-Kompetenz Ihrer Teams?", hint: "Einsteiger / Fortgeschritten / Experte" },
    ]
  },
  {
    id: "useCases",
    title: "🎯 Use Cases & Priorisierung",
    questions: [
      { q: "Konkrete KI-Use-Cases identifiziert / umgesetzt?", hint: "" },
      { q: "Größtes KI-Potenzial in welchem Bereich?", hint: "" },
      { q: "Budget für KI-Initiativen?", hint: "< 50k, 50–200k, 200k–1M, > 1M EUR/CHF" },
      { q: "Zeithorizont?", hint: "Kurzfristig / Mittelfristig / Langfristig" },
    ]
  },
];

/**
 * Status labels and colors
 */
export const STATUS_CONFIG = {
  draft: { bg: '#FEF9E7', color: '#B7950B', label: 'Entwurf' },
  in_progress: { bg: '#EBF5FB', color: '#2E86C1', label: 'In Bearbeitung' },
  completed: { bg: '#EAFAF1', color: '#27AE60', label: 'Abgeschlossen' },
};

/**
 * Get industry display info (simplified version for lists)
 */
export const getIndustryInfo = (industryKey) => {
  const industry = INDUSTRIES[industryKey];
  if (!industry) {
    return { label: industryKey || 'Unbekannt', icon: '📋', color: '#7F8C8D' };
  }
  return {
    label: industry.label,
    icon: industry.icon,
    color: industry.color,
    gradient: industry.gradient,
  };
};