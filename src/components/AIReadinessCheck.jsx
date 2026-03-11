import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CollaborationProvider, useCollaboration } from '../contexts/CollaborationContext';
import { useLanguage } from '../i18n';
import { LanguageSwitcherCompact } from '../i18n/LanguageSwitcher';
import MultiSelectDropdown from './MultiSelectDropdown';
import { generatePDF } from '../lib/pdfExport';
import { generatePowerPoint } from '../lib/pptxExport';
import Recommendations from './Recommendations';
import SectionAIPanel from './SectionAIPanel';
import SectionRecommendations from './SectionRecommendations';
import HeatMap from './HeatMap';
import RiskMatrix from './RiskMatrix';
import PresenceIndicator, { TypingIndicator } from './PresenceIndicator';
import { AutoFillButton, AutoFillPanel } from './AutoFillSuggestion';

/* ═══════════════════════════════════════════════════════════════
   COMPLETE ADESSO INDUSTRY MAP (DE + CH)
   Source: adesso.de/branchen + adesso.ch/branchen
   ═══════════════════════════════════════════════════════════════ */

// Industry metadata (non-translatable parts)
const INDUSTRY_META = {
  insurance: { icon: "🛡️", color: "#1A5276", gradient: "linear-gradient(135deg, #1A5276 0%, #154360 100%)", country: "DE + CH", priority: "core" },
  banking: { icon: "🏦", color: "#2C3E50", gradient: "linear-gradient(135deg, #2C3E50 0%, #1A252F 100%)", country: "DE + CH", priority: "core" },
  healthcare: { icon: "🏥", color: "#1ABC9C", gradient: "linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)", country: "DE + CH", priority: "core" },
  automotive: { icon: "🚗", color: "#E74C3C", gradient: "linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)", country: "DE + CH", priority: "core" },
  manufacturing: { icon: "⚙️", color: "#E67E22", gradient: "linear-gradient(135deg, #E67E22 0%, #D35400 100%)", country: "DE + CH", priority: "core" },
  retail: { icon: "🛒", color: "#27AE60", gradient: "linear-gradient(135deg, #27AE60 0%, #1E8449 100%)", country: "DE + CH", priority: "core" },
  energy: { icon: "⚡", color: "#F39C12", gradient: "linear-gradient(135deg, #F39C12 0%, #E67E22 100%)", country: "DE + CH", priority: "core" },
  publicSector: { icon: "🏛️", color: "#2980B9", gradient: "linear-gradient(135deg, #2980B9 0%, #1F6DA0 100%)", country: "DE + CH", priority: "core" },
  lifeSciences: { icon: "💊", color: "#8E44AD", gradient: "linear-gradient(135deg, #8E44AD 0%, #6C3483 100%)", country: "DE + CH", priority: "core" },
  lottery: { icon: "🎰", color: "#D4AC0D", gradient: "linear-gradient(135deg, #D4AC0D 0%, #B7950B 100%)", country: "DE", priority: "important" },
  transport: { icon: "🚆", color: "#3498DB", gradient: "linear-gradient(135deg, #3498DB 0%, #2471A3 100%)", country: "DE + CH", priority: "important" },
  media: { icon: "🎬", color: "#9B59B6", gradient: "linear-gradient(135deg, #9B59B6 0%, #7D3C98 100%)", country: "DE + CH", priority: "important" },
  defense: { icon: "🎖️", color: "#566573", gradient: "linear-gradient(135deg, #566573 0%, #2C3E50 100%)", country: "DE", priority: "important" },
  foodBeverage: { icon: "🍽️", color: "#E74C3C", gradient: "linear-gradient(135deg, #D35400 0%, #E74C3C 100%)", country: "DE", priority: "niche" },
  construction: { icon: "🏗️", color: "#DC7633", gradient: "linear-gradient(135deg, #DC7633 0%, #BA4A00 100%)", country: "DE", priority: "niche" },
  tradeFairsSports: { icon: "🏟️", color: "#16A085", gradient: "linear-gradient(135deg, #16A085 0%, #1ABC9C 100%)", country: "DE + CH", priority: "niche" },
  telecom: { icon: "📡", color: "#2980B9", gradient: "linear-gradient(135deg, #2980B9 0%, #3498DB 100%)", country: "CH", priority: "niche" },
  professionalServices: { icon: "💼", color: "#7D3C98", gradient: "linear-gradient(135deg, #7D3C98 0%, #6C3483 100%)", country: "DE + CH", priority: "important" },
  chemical: { icon: "🧪", color: "#117A65", gradient: "linear-gradient(135deg, #117A65 0%, #0E6655 100%)", country: "DE + CH", priority: "important" },
};

// Helper function to build industries from translations
function buildIndustries(translatedIndustries) {
  if (!translatedIndustries) return {};
  
  const result = {};
  Object.keys(INDUSTRY_META).forEach(key => {
    const meta = INDUSTRY_META[key];
    const trans = translatedIndustries[key];
    if (trans) {
      result[key] = {
        ...meta,
        label: trans.label,
        desc: trans.desc,
        specificQuestions: trans.sections?.map(s => ({
          section: s.title,
          questions: s.questions,
        })) || [],
      };
    }
  });
  return result;
}

// Helper function to build core sections from translations
function buildCoreSections(translatedSections) {
  if (!translatedSections) return [];
  
  const sectionOrder = ['general', 'landscape', 'licensing', 'btp', 'cloud', 'aiSap', 'aiNonSap', 'data', 'security', 'org', 'useCases'];
  
  return sectionOrder.map(id => {
    const trans = translatedSections[id];
    if (!trans) return null;
    return {
      id,
      title: trans.title,
      questions: trans.questions.map(q => ({
        q: q.q,
        hint: q.hint || '',
        type: id === 'general' ? 'text' : undefined,
      })),
    };
  }).filter(Boolean);
}

// Fallback German industries (used when translations not loaded)
const INDUSTRIES_DE = {
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

const CORE_SECTIONS_DE = [
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

// ── AI READINESS SCORING ──
function computeReadinessFromAnswers(answers) {
  const val = (sId, qi) => (answers[`${sId}_${qi}`] || "").toLowerCase().trim();

  let sap = 20;
  const ls = (qi) => val("landscape", qi);
  if (/s\/4|s4|hana|rise|grow/i.test(ls(0)+ls(1)+ls(2))) sap += 18;
  if (/cloud|rise|grow|public/i.test(ls(2))) sap += 14;
  if (/hana/i.test(ls(3))) sap += 8;
  if (/ja|yes|plan/i.test(ls(4))) sap += 5;
  if (/clean.?core|ja|yes/i.test(ls(5))) sap += 15;
  if (/ja|yes|aktiv|nutz/i.test(val("aiSap",0))) sap += 10;
  if (/ja|yes|aktiv|plan/i.test(val("aiSap",1))) sap += 10;
  sap = Math.min(100, sap);

  let btp = 10;
  if (/ja|yes|nutz/i.test(val("btp",0))) btp += 22;
  if (/ai.?core|integration|datasphere|build/i.test(val("btp",1))) btp += 15;
  if (/cpea|btpea|subscription/i.test(val("btp",2))) btp += 10;
  if (/ja|yes|nutz|plan/i.test(val("btp",3))) btp += 10;
  if (/ja|yes|nutz|plan/i.test(val("btp",4))) btp += 10;
  if (/ja|yes|ai|joule|core/i.test(val("licensing",1))) btp += 13;
  if (/ja|yes/i.test(val("licensing",2))) btp += 10;
  btp = Math.min(100, btp);

  let data = 10;
  if (/sehr gut|excellent/i.test(val("data",0))) data += 30;
  else if (/gut|good/i.test(val("data",0))) data += 20;
  else if (/ausbau|moderate/i.test(val("data",0))) data += 10;
  if (/ja|yes|vorhanden/i.test(val("data",1))) data += 25;
  if (/ja|yes|bw|datasphere|lake|warehouse|snowflake/i.test(val("data",2))) data += 20;
  if (val("aiNonSap",0).length > 5) data += 8;
  if (val("aiNonSap",1).length > 5) data += 7;
  data = Math.min(100, data);

  return { sap, btp, data };
}

const GaugeMeter = ({ value, label, sublabel }) => {
  const c = Math.max(0, Math.min(100, value));
  // Semicircle: left (0%) → top (50%) → right (100%)
  // θ = π at 0%, π/2 at 50%, 0 at 100%
  const theta = Math.PI * (1 - c / 100);
  const r = 78, cx = 100, cy = 92;
  const nLen = r - 14;
  const nx = cx + nLen * Math.cos(theta);
  const ny = cy - nLen * Math.sin(theta); // minus because SVG y is inverted
  const col = c >= 66 ? "#27AE60" : c >= 33 ? "#F39C12" : "#E74C3C";
  const lbl = c >= 66 ? "AI-Ready ✓" : c >= 33 ? "Teilweise bereit" : "Nicht bereit";
  const uid = label.replace(/\s/g,"");
  return (
    <div style={{textAlign:"center",flex:1,minWidth:170}}>
      <svg viewBox="0 0 200 128" style={{width:"100%",maxWidth:210}}>
        <defs>
          <linearGradient id={`grd${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E74C3C"/><stop offset="40%" stopColor="#F39C12"/>
            <stop offset="70%" stopColor="#F1C40F"/><stop offset="100%" stopColor="#27AE60"/>
          </linearGradient>
        </defs>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#E8EDF2" strokeWidth="16" strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={`url(#grd${uid})`} strokeWidth="16" strokeLinecap="round"/>
        {[0,25,50,75,100].map(t=>{
          const tt=Math.PI*(1-t/100);
          const x1=cx+(r+11)*Math.cos(tt);const y1=cy-(r+11)*Math.sin(tt);
          const x2=cx+(r+15)*Math.cos(tt);const y2=cy-(r+15)*Math.sin(tt);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#BDC3C7" strokeWidth="1.5"/>;
        })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={col} strokeWidth="3" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="6" fill={col}/><circle cx={cx} cy={cy} r="3" fill="#fff"/>
        <text x={cx} y={cy+22} textAnchor="middle" fontSize="20" fontWeight="800" fontFamily="Outfit" fill={col}>{c}%</text>
      </svg>
      <div style={{fontSize:13,fontWeight:700,color:"#1B3A5C",marginTop:2}}>{label}</div>
      <div style={{fontSize:11,fontWeight:600,color:col,marginTop:2}}>{lbl}</div>
      {sublabel&&<div style={{fontSize:10,color:"#95A5A6",marginTop:2}}>{sublabel}</div>}
    </div>
  );
};

// ── EXPORT FUNCTIONS ──
// Translations for export
const EXPORT_TRANSLATIONS = {
  de: {
    title: "SAP AI Readiness Check",
    industry: "Branche",
    date: "Datum",
    answered: "Beantwortet",
    general: "Allgemein",
    aiReadinessAssessment: "AI Readiness Assessment",
    sapSystem: "SAP System",
    btpPlatform: "BTP & AI Platform",
    dataMaturity: "Datenreife",
    sapSub: "S/4HANA, Clean Core, Joule",
    btpSub: "AI Core, Datasphere, BDC",
    dataSub: "Qualität, Governance, DWH",
    overallRating: "Gesamtbewertung",
    aiReady: "AI-Ready ✓",
    partiallyReady: "Teilweise bereit",
    notReady: "Nicht bereit",
    goodForAI: "Gut für SAP Business AI aufgestellt",
    basicsPresent: "Grundlagen vorhanden — gezielte Maßnahmen empfohlen",
    significantAction: "Erheblicher Handlungsbedarf vor KI-Einführung",
    recommendations: "Empfehlungen",
    sapMigration: "SAP-System: Migration auf S/4HANA und Clean-Core-Strategie empfohlen",
    btpRequired: "BTP: SAP BTP mit AI Core und CPEA/BTPEA-Lizenzierung erforderlich",
    dataStrategy: "Daten: Datenstrategie, Data Governance und zentrales DWH aufbauen",
    sapJoule: "SAP: Joule aktivieren und Clean-Core-Strategie vorantreiben",
    btpEvaluate: "BTP: SAP AI Core und SAP Business Data Cloud evaluieren",
    dataGovernance: "Daten: Data Governance stärken und SAP Datasphere einführen",
    sapReady: "SAP-System ist AI-ready",
    btpReady: "BTP & AI Platform sind einsatzbereit",
    dataReady: "Datenreife unterstützt KI-Initiativen",
    industrySpecific: "Branchenspezifisch",
    notAnswered: "— nicht beantwortet —",
    footer: "SAP AI Readiness Check — erstellt mit AI Readiness Check Tool",
    confidential: "VERTRAULICH",
  },
  en: {
    title: "SAP AI Readiness Check",
    industry: "Industry",
    date: "Date",
    answered: "Answered",
    general: "General",
    aiReadinessAssessment: "AI Readiness Assessment",
    sapSystem: "SAP System",
    btpPlatform: "BTP & AI Platform",
    dataMaturity: "Data Maturity",
    sapSub: "S/4HANA, Clean Core, Joule",
    btpSub: "AI Core, Datasphere, BDC",
    dataSub: "Quality, Governance, DWH",
    overallRating: "Overall Rating",
    aiReady: "AI-Ready ✓",
    partiallyReady: "Partially Ready",
    notReady: "Not Ready",
    goodForAI: "Well positioned for SAP Business AI",
    basicsPresent: "Basics in place — targeted measures recommended",
    significantAction: "Significant action required before AI implementation",
    recommendations: "Recommendations",
    sapMigration: "SAP System: Migration to S/4HANA and Clean Core strategy recommended",
    btpRequired: "BTP: SAP BTP with AI Core and CPEA/BTPEA licensing required",
    dataStrategy: "Data: Data strategy, Data Governance and central DWH needed",
    sapJoule: "SAP: Activate Joule and advance Clean Core strategy",
    btpEvaluate: "BTP: Evaluate SAP AI Core and SAP Business Data Cloud",
    dataGovernance: "Data: Strengthen Data Governance and introduce SAP Datasphere",
    sapReady: "SAP System is AI-ready",
    btpReady: "BTP & AI Platform are ready for use",
    dataReady: "Data maturity supports AI initiatives",
    industrySpecific: "Industry-specific",
    notAnswered: "— not answered —",
    footer: "SAP AI Readiness Check — created with AI Readiness Check Tool",
    confidential: "CONFIDENTIAL",
  }
};

function buildExportHTML(allSections, answers, industry, rd, format, lang = 'de') {
  const t = EXPORT_TRANSLATIONS[lang] || EXPORT_TRANSLATIONS.de;
  const overall = Math.round((rd.sap + rd.btp + rd.data) / 3);
  const gaugeColor = (v) => v >= 66 ? "#27AE60" : v >= 33 ? "#F39C12" : "#E74C3C";
  const gaugeLabel = (v) => v >= 66 ? t.aiReady : v >= 33 ? t.partiallyReady : t.notReady;
  const barHTML = (val, label, sub) => {
    const c = gaugeColor(val);
    return `<div style="flex:1;min-width:180px;text-align:center;padding:12px;">
      <div style="font-size:13px;font-weight:700;color:#1B3A5C;margin-bottom:8px;">${label}</div>
      <div style="background:#E8EDF2;border-radius:8px;height:20px;overflow:hidden;position:relative;margin:0 auto;max-width:200px;">
        <div style="background:${c};height:100%;width:${val}%;border-radius:8px;transition:width 0.3s;"></div>
        <div style="position:absolute;top:0;left:0;right:0;text-align:center;font-size:12px;font-weight:700;color:#fff;line-height:20px;">${val}% — ${gaugeLabel(val)}</div>
      </div>
      <div style="font-size:10px;color:#7F8C8D;margin-top:4px;">${sub}</div>
    </div>`;
  };
  const overallColor = gaugeColor(overall);
  const dateLocale = lang === 'en' ? 'en-GB' : 'de-DE';

  const wordMeta = format === "word" ? `
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="AI Readiness Check">
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->` : "";

  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><title>${t.title} — ${industry?.label || t.general}</title>${wordMeta}
<style>
  @page { size: A4; margin: 20mm 18mm; }
  body { font-family: Calibri, Arial, Helvetica, sans-serif; color: #1B3A5C; font-size: 11pt; line-height: 1.5; margin: 0; padding: 20px; }
  h1 { font-size: 22pt; color: #1B3A5C; border-bottom: 3px solid #2E86C1; padding-bottom: 8px; margin: 0 0 6px 0; }
  h2 { font-size: 14pt; color: #2E86C1; margin: 20px 0 8px 0; page-break-after: avoid; }
  h3 { font-size: 12pt; color: #1B3A5C; margin: 14px 0 6px 0; }
  .meta { color: #7F8C8D; font-size: 10pt; margin-bottom: 16px; }
  .assessment { background: #F7F9FC; border: 2px solid #D5D8DC; border-radius: 8px; padding: 16px; margin: 16px 0 24px 0; page-break-inside: avoid; }
  .gauges { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 12px 0; }
  .overall { text-align: center; padding: 12px; border-radius: 8px; margin-top: 12px; }
  .section { margin-bottom: 16px; page-break-inside: avoid; }
  .section-header { background: #1B3A5C; color: white; padding: 8px 12px; font-weight: 700; font-size: 11pt; border-radius: 4px 4px 0 0; }
  .section-header.industry { background: ${industry?.color || "#2E86C1"}; }
  table { width: 100%; border-collapse: collapse; margin: 0; }
  td, th { border: 1px solid #D5D8DC; padding: 7px 10px; font-size: 10pt; vertical-align: top; }
  th { background: #E8EDF2; font-weight: 600; text-align: left; width: 45%; }
  td { background: #FAFBFC; }
  .empty { color: #BDC3C7; font-style: italic; }
  .footer { margin-top: 24px; text-align: center; color: #95A5A6; font-size: 9pt; border-top: 1px solid #E8EDF2; padding-top: 10px; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: 700; }
  .rec { font-size: 10pt; margin: 4px 0; padding: 4px 8px; border-radius: 4px; }
  .rec.red { background: #FDEDEC; color: #E74C3C; }
  .rec.yellow { background: #FEF9E7; color: #B7950B; }
  .rec.green { background: #EAFAF1; color: #1E8449; }
</style></head><body>

<h1>${industry?.icon || "🤖"} ${t.title}</h1>
<div class="meta">
  ${t.industry}: <strong>${industry?.label || t.general}</strong> &nbsp;|&nbsp;
  ${t.date}: <strong>${new Date().toLocaleDateString(dateLocale)}</strong> &nbsp;|&nbsp;
  ${t.answered}: <strong>${Object.values(answers).filter(v => v?.trim()).length} / ${allSections.reduce((s, sec) => s + sec.questions.length, 0)}</strong>
</div>

<div class="assessment">
  <h2 style="margin-top:0;border:none;">🎯 ${t.aiReadinessAssessment}</h2>
  <div class="gauges">
    ${barHTML(rd.sap, t.sapSystem, t.sapSub)}
    ${barHTML(rd.btp, t.btpPlatform, t.btpSub)}
    ${barHTML(rd.data, t.dataMaturity, t.dataSub)}
  </div>
  <div class="overall" style="background:${overall >= 66 ? "#EAFAF1" : overall >= 33 ? "#FEF9E7" : "#FDEDEC"};border:1.5px solid ${overallColor}40;">
    <div style="font-size:10pt;color:#5D6D7E;">${t.overallRating}</div>
    <div style="font-size:22pt;font-weight:800;color:${overallColor};">${overall}%</div>
    <div style="font-size:10pt;color:${overallColor};font-weight:600;">
      ${overall >= 66 ? t.goodForAI : overall >= 33 ? t.basicsPresent : t.significantAction}
    </div>
  </div>
  <div style="margin-top:10px;">
    <strong style="font-size:10pt;">${t.recommendations}:</strong>
    ${rd.sap < 33 ? `<div class="rec red">⚠️ ${t.sapMigration}</div>` : ""}
    ${rd.btp < 33 ? `<div class="rec red">⚠️ ${t.btpRequired}</div>` : ""}
    ${rd.data < 33 ? `<div class="rec red">⚠️ ${t.dataStrategy}</div>` : ""}
    ${rd.sap >= 33 && rd.sap < 66 ? `<div class="rec yellow">💡 ${t.sapJoule}</div>` : ""}
    ${rd.btp >= 33 && rd.btp < 66 ? `<div class="rec yellow">💡 ${t.btpEvaluate}</div>` : ""}
    ${rd.data >= 33 && rd.data < 66 ? `<div class="rec yellow">💡 ${t.dataGovernance}</div>` : ""}
    ${rd.sap >= 66 ? `<div class="rec green">✅ ${t.sapReady}</div>` : ""}
    ${rd.btp >= 66 ? `<div class="rec green">✅ ${t.btpReady}</div>` : ""}
    ${rd.data >= 66 ? `<div class="rec green">✅ ${t.dataReady}</div>` : ""}
  </div>
</div>

${allSections.map(s => `
  <div class="section">
    <div class="section-header${s.isIndustry ? " industry" : ""}">${s.title}${s.isIndustry ? ` <span class="tag" style="background:rgba(255,255,255,0.3);color:white;margin-left:8px;">${t.industrySpecific}</span>` : ""}</div>
    <table>
      ${s.questions.map((q, qi) => {
        const ans = answers[`${s.id}_${qi}`];
        return `<tr>
          <th>${q.q}${q.hint ? `<br><span style="font-weight:400;color:#95A5A6;font-size:9pt;">${q.hint}</span>` : ""}</th>
          <td${!ans?.trim() ? ' class="empty"' : ""}>${ans?.trim() || t.notAnswered}</td>
        </tr>`;
      }).join("")}
    </table>
  </div>
`).join("")}

<div class="footer">
  ${t.footer} — ${new Date().toLocaleDateString(dateLocale)} — ${t.confidential}
</div>
</body></html>`;
}

function exportToWord(allSections, answers, industry, rd, lang = 'de') {
  const html = buildExportHTML(allSections, answers, industry, rd, "word", lang);
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AI_Readiness_Check_${(industry?.label || "Allgemein").replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_")}_${new Date().toISOString().slice(0,10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToPDF(allSections, answers, industry, rd, lang = 'de') {
  const html = buildExportHTML(allSections, answers, industry, rd, "pdf", lang);
  const printWin = window.open("", "_blank", "width=900,height=700");
  const alertMsg = lang === 'en' ? "Please allow pop-ups for PDF export." : "Bitte erlauben Sie Pop-ups für den PDF-Export.";
  if (!printWin) { alert(alertMsg); return; }
  printWin.document.write(html);
  printWin.document.close();
  setTimeout(() => {
    printWin.focus();
    printWin.print();
  }, 600);
}

// ───────── UI COMPONENTS ─────────

const AnimBG = () => (
  <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
    <div style={{position:"absolute",top:"-20%",right:"-10%",width:"600px",height:"600px",borderRadius:"50%",background:"radial-gradient(circle, rgba(30,60,114,0.06) 0%, transparent 70%)",animation:"f1 20s ease-in-out infinite"}}/>
    <div style={{position:"absolute",bottom:"-15%",left:"-5%",width:"500px",height:"500px",borderRadius:"50%",background:"radial-gradient(circle, rgba(46,134,193,0.05) 0%, transparent 70%)",animation:"f2 25s ease-in-out infinite"}}/>
    <style>{`
      @keyframes f1{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,30px)}}
      @keyframes f2{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-40px)}}
    `}</style>
  </div>
);

const Toggle = ({ on, onToggle, color = "#2E86C1" }) => (
  <div onClick={onToggle} style={{width:42,height:22,borderRadius:11,background:on?color:"#D5D8DC",position:"relative",cursor:"pointer",transition:"all 0.3s",flexShrink:0}}>
    <div style={{width:18,height:18,borderRadius:9,background:"#fff",position:"absolute",top:2,left:on?22:2,transition:"all 0.3s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
  </div>
);

export default function AIReadinessCheck({ 
  assessment = null,  // Existing assessment object from database
  onSave = null,      // Callback when assessment is saved
  onBack = null,      // Callback to go back to dashboard
  onNavigateToDashboard = null, // Callback to navigate to dashboard
}) {
  const { user } = useAuth() || {};
  
  // If we have an existing assessment, start at "fill" step with pre-selected industries
  const [step, setStep] = useState(assessment ? "fill" : "select");
  // Support both single industry (legacy) and multiple industries
  const [selectedIndustries, setSelectedIndustries] = useState(() => {
    if (assessment?.industries) {
      try {
        const parsed = JSON.parse(assessment.industries);
        return Array.isArray(parsed) ? parsed : [assessment.industry].filter(Boolean);
      } catch {
        return [assessment.industry].filter(Boolean);
      }
    }
    return assessment?.industry ? [assessment.industry] : [];
  });
  // Keep selectedIndustry for backward compatibility (primary industry)
  const selectedIndustry = selectedIndustries[0] || null;
  const [hovered, setHovered] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeSection, setActiveSection] = useState(0);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [showIndQ, setShowIndQ] = useState(true);
  const [enabledCore, setEnabledCore] = useState(CORE_SECTIONS_DE.reduce((a,s)=>({...a,[s.id]:true}),{}));
  const [countryFilter, setCountryFilter] = useState("all"); // all, DE, CH
  const [priorityFilter, setPriorityFilter] = useState("all"); // all, core, important, niche
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [sectionAssignments, setSectionAssignments] = useState({});
  const contentRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  
  // Real-time collaboration - use context if available
  const collaboration = useCollaboration();
  const { 
    activeUsers = [], 
    isConnected: realtimeEnabled = false,
    broadcastAnswerUpdate,
    broadcastTypingStart,
    broadcastTypingStop,
    updatePresence,
    getTypingUsersForQuestion,
    pendingConflict,
    resolveConflict,
  } = collaboration || {};
  
  // Use i18n context for language
  const { language, setLanguage, t, tSection } = useLanguage();
  
  // Get translated industries and sections based on current language
  const INDUSTRIES = React.useMemo(() => {
    const translatedIndustries = tSection('industries');
    if (translatedIndustries && Object.keys(translatedIndustries).length > 0) {
      return buildIndustries(translatedIndustries);
    }
    return INDUSTRIES_DE; // Fallback to German
  }, [language, tSection]);
  
  const CORE_SECTIONS = React.useMemo(() => {
    const translatedSections = tSection('sections');
    if (translatedSections && Object.keys(translatedSections).length > 0) {
      return buildCoreSections(translatedSections);
    }
    return CORE_SECTIONS_DE; // Fallback to German
  }, [language, tSection]);

  // Load existing answers when assessment is provided
  useEffect(() => {
    if (assessment?.id) {
      loadAnswers(assessment.id);
      loadSectionAssignments(assessment.id);
      loadCollaborators();
    }
  }, [assessment?.id]);

  // Auto-save answers with debounce
  useEffect(() => {
    if (assessment?.id && Object.keys(answers).length > 0) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveAnswers();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [answers]);

  const loadAnswers = async (assessmentId) => {
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (error) throw error;

      // Convert array of answers to object format
      const answersObj = {};
      data?.forEach(ans => {
        answersObj[`${ans.section_id}_${ans.question_index}`] = ans.answer;
      });
      setAnswers(answersObj);
    } catch (error) {
      console.error('Error loading answers:', error);
    }
  };

  const loadSectionAssignments = async (assessmentId) => {
    try {
      const { data, error } = await supabase
        .from('section_assignments')
        .select(`
          *,
          profiles:assigned_to (id, full_name, email)
        `)
        .eq('assessment_id', assessmentId);

      if (error) throw error;

      // Convert to object keyed by section_id
      // Parse assignees from JSON string if stored that way
      const assignmentsObj = {};
      data?.forEach(assignment => {
        // Try to parse assignees_json if it exists, otherwise use assigned_to as single assignee
        let assignees = [];
        if (assignment.assignees_json) {
          try {
            assignees = JSON.parse(assignment.assignees_json);
          } catch (e) {
            assignees = assignment.assigned_to ? [assignment.assigned_to] : [];
          }
        } else if (assignment.assigned_to) {
          assignees = [assignment.assigned_to];
        }
        
        assignmentsObj[assignment.section_id] = {
          ...assignment,
          assignees: assignees,
        };
      });
      setSectionAssignments(assignmentsObj);
    } catch (error) {
      console.error('Error loading section assignments:', error);
    }
  };

  const loadCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(50);

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const saveAnswers = async () => {
    if (!assessment?.id || !user?.id) return;

    setSaving(true);
    try {
      // Convert answers object to array for upsert
      const answersArray = Object.entries(answers).map(([key, value]) => {
        const [sectionId, questionIndex] = key.split('_');
        return {
          assessment_id: assessment.id,
          section_id: sectionId,
          question_index: parseInt(questionIndex),
          answer: value,
          answered_by: user.id,
          answered_at: new Date().toISOString(),
        };
      }).filter(a => a.answer?.trim()); // Only save non-empty answers

      if (answersArray.length > 0) {
        const { error } = await supabase
          .from('answers')
          .upsert(answersArray, {
            onConflict: 'assessment_id,section_id,question_index',
          });

        if (error) throw error;
      }

      // Update assessment status and updated_by
      const updateData = { 
        updated_at: new Date().toISOString(),
        updated_by: user.id 
      };
      if (assessment.status === 'draft') {
        updateData.status = 'in_progress';
      }
      
      await supabase
        .from('assessments')
        .update(updateData)
        .eq('id', assessment.id);

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving answers:', error);
    } finally {
      setSaving(false);
    }
  };

  const assignSection = async (sectionId, sectionTitle, userId) => {
    if (!assessment?.id) return;

    try {
      const { error } = await supabase
        .from('section_assignments')
        .upsert({
          assessment_id: assessment.id,
          section_id: sectionId,
          section_title: sectionTitle,
          assigned_to: userId,
          status: 'not_started',
        }, {
          onConflict: 'assessment_id,section_id',
        });

      if (error) throw error;
      
      // Reload assignments
      loadSectionAssignments(assessment.id);
    } catch (error) {
      console.error('Error assigning section:', error);
    }
  };

  // Assign multiple users to a section
  const assignSectionMultiple = async (sectionId, sectionTitle, userIds) => {
    if (!assessment?.id) return;

    try {
      // Update local state immediately for better UX
      setSectionAssignments(prev => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          assignees: userIds,
          assigned_to: userIds[0] || null,
        }
      }));

      // Save to database with assignees_json column
      const { error: assignmentError } = await supabase
        .from('section_assignments')
        .upsert({
          assessment_id: assessment.id,
          section_id: sectionId,
          section_title: sectionTitle,
          assigned_to: userIds[0] || null, // Keep first user as primary for backward compatibility
          assignees_json: JSON.stringify(userIds), // Store all assignees as JSON
          status: 'not_started',
        }, {
          onConflict: 'assessment_id,section_id',
        });

      if (assignmentError) {
        console.error('Error saving assignment:', assignmentError);
        // If the assignees_json column doesn't exist yet, try without it
        if (assignmentError.message?.includes('assignees_json')) {
          const { error: fallbackError } = await supabase
            .from('section_assignments')
            .upsert({
              assessment_id: assessment.id,
              section_id: sectionId,
              section_title: sectionTitle,
              assigned_to: userIds[0] || null,
              status: 'not_started',
            }, {
              onConflict: 'assessment_id,section_id',
            });
          if (fallbackError) throw fallbackError;
        } else {
          throw assignmentError;
        }
      }
      
    } catch (error) {
      console.error('Error assigning section to multiple users:', error);
    }
  };

  const industry = INDUSTRIES[selectedIndustry];

  // Check if user can edit a specific section
  const canEditSection = useCallback((sectionId) => {
    // If no assessment, user is creating new - can edit everything
    if (!assessment?.id) return true;
    
    // If user is the assessment owner, they can edit everything
    if (assessment?.created_by === user?.id) return true;
    
    // Check if user is assigned to this section
    const assignment = sectionAssignments[sectionId];
    if (!assignment) return false;
    
    // Check if user is in the assignees list
    const assignees = assignment.assignees || [];
    if (assignees.includes(user?.id)) return true;
    
    // Check legacy assigned_to field
    if (assignment.assigned_to === user?.id) return true;
    
    return false;
  }, [assessment, user, sectionAssignments]);

  // Check if user is the assessment owner
  const isOwner = assessment?.created_by === user?.id || !assessment?.id;

  const filteredIndustries = Object.entries(INDUSTRIES).filter(([_, ind]) => {
    if (countryFilter !== "all" && !ind.country.includes(countryFilter)) return false;
    if (priorityFilter !== "all" && ind.priority !== priorityFilter) return false;
    return true;
  });

  // Combine industry-specific questions from ALL selected industries
  const allSections = useMemo(() => {
    const core = CORE_SECTIONS.filter(s => enabledCore[s.id]);
    
    // If no industries selected or industry questions disabled, return only core sections
    if (selectedIndustries.length === 0 || !showIndQ) {
      return core;
    }
    
    // Collect industry-specific sections from ALL selected industries
    const industrySections = [];
    let sectionCounter = 0;
    
    selectedIndustries.forEach((indKey, industryIndex) => {
      const ind = INDUSTRIES[indKey];
      if (!ind || !ind.specificQuestions) return;
      
      // Add each industry's specific questions as separate sections
      ind.specificQuestions.forEach((sq, sqIndex) => {
        industrySections.push({
          id: `ind_${industryIndex}_${sqIndex}`,
          title: `${ind.icon} ${sq.section}`,
          questions: sq.questions.map(q => ({ q: q.q, hint: q.hint })),
          isIndustry: true,
          industryKey: indKey,
          industryLabel: ind.label,
          industryColor: ind.color,
        });
        sectionCounter++;
      });
    });
    
    // Insert industry sections after the AI SAP section
    const aiIdx = core.findIndex(s => s.id === "aiSap");
    const result = [...core];
    result.splice(aiIdx >= 0 ? aiIdx + 1 : core.length, 0, ...industrySections);
    
    return result;
  }, [CORE_SECTIONS, INDUSTRIES, selectedIndustries, enabledCore, showIndQ]);

  const totalQ = allSections.reduce((s,sec) => s + sec.questions.length, 0);
  const answeredQ = Object.values(answers).filter(v => v?.trim()).length;
  const progress = totalQ > 0 ? (answeredQ / totalQ) * 100 : 0;

  // Handle answer changes with real-time broadcast
  const handleAnswer = (sid, qi, val) => {
    const key = `${sid}_${qi}`;
    setAnswers(p => ({ ...p, [key]: val }));
    
    // Broadcast to other users if collaboration is enabled
    if (broadcastAnswerUpdate) {
      broadcastAnswerUpdate(key, val);
    }
  };
  
  // Update presence when section changes
  useEffect(() => {
    if (updatePresence && allSections[activeSection]) {
      updatePresence(allSections[activeSection].id);
    }
  }, [activeSection, allSections, updatePresence]);

  // Listen for remote answer updates from collaboration
  const remoteAnswers = collaboration?.remoteAnswers || {};
  useEffect(() => {
    if (Object.keys(remoteAnswers).length > 0) {
      // Merge remote answers with local answers (remote takes precedence for new updates)
      setAnswers(prev => {
        const updated = { ...prev };
        Object.entries(remoteAnswers).forEach(([key, remote]) => {
          // Only update if remote is newer or local is empty
          if (!prev[key] || remote.value !== prev[key]) {
            updated[key] = remote.value;
          }
        });
        return updated;
      });
    }
  }, [remoteAnswers]);

  const gStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Outfit','DM Sans',sans-serif}
    .card{transition:all .3s cubic-bezier(.4,0,.2,1);cursor:pointer}
    .card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.1)!important}
    .btn{transition:all .2s;cursor:pointer}
    .btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(30,60,114,.18)!important}
    .nav:hover{background:#EBF5FB!important}
    textarea:focus,input:focus{outline:none;border-color:#2E86C1!important;box-shadow:0 0 0 3px rgba(46,134,193,.12)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .pill{display:inline-flex;align-items:center;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;border:1.5px solid transparent}
    .pill:hover{transform:translateY(-1px)}
  `;

  // ═══════ STEP: SELECT INDUSTRY ═══════
  if (step === "select") {
    const priorityCounts = { core: 0, important: 0, niche: 0 };
    Object.values(INDUSTRIES).forEach(i => priorityCounts[i.priority]++);
    return (
      <div style={{minHeight:"100vh",background:"#F7F9FC",position:"relative"}}>
        <AnimBG/><style>{gStyle}</style>
        <div style={{position:"relative",zIndex:1,maxWidth:"1060px",margin:"0 auto",padding:"40px 24px"}}>
          {/* Language Switcher & Presence Indicator - Top Right */}
          <div style={{position:"absolute",top:20,right:24,zIndex:10,display:"flex",alignItems:"center",gap:12}}>
            {assessment?.id && (
              <PresenceIndicator 
                activeUsers={activeUsers}
                isConnected={realtimeEnabled}
                currentSection={allSections[activeSection]?.id}
              />
            )}
            <LanguageSwitcherCompact />
          </div>
          
          <div style={{textAlign:"center",marginBottom:"36px",animation:"fadeUp .6s ease-out"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,#1B3A5C,#2E86C1)",padding:"8px 22px",borderRadius:40,marginBottom:20}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:13,letterSpacing:2,textTransform:"uppercase"}}>AI Readiness Check</span>
            </div>
            <h1 style={{fontSize:"clamp(26px,3.5vw,38px)",fontWeight:800,color:"#1B3A5C",lineHeight:1.2,marginBottom:12}}>
              {language === 'en' ? 'Industry-Specific AI Readiness Check' : 'Branchenspezifischer AI Readiness Check'}
            </h1>
            <p style={{fontSize:15,color:"#5D6D7E",maxWidth:620,margin:"0 auto",lineHeight:1.6}}>
              {language === 'en' 
                ? "Select your customer's industry — based on the complete adesso industry portfolio for Germany and Switzerland."
                : 'Wählen Sie die Branche Ihres Kunden — basierend auf dem vollständigen adesso-Branchenportfolio für Deutschland und die Schweiz.'}
            </p>
          </div>

          {/* Filters */}
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:24,animation:"fadeUp .5s ease-out .1s both"}}>
            <span style={{fontSize:13,fontWeight:600,color:"#7F8C8D",alignSelf:"center",marginRight:4}}>Land:</span>
            {[["all","🇩🇪🇨🇭 Alle"],["DE","🇩🇪 Deutschland"],["CH","🇨🇭 Schweiz"]].map(([v,l])=>(
              <span key={v} className="pill" onClick={()=>setCountryFilter(v)}
                style={{background:countryFilter===v?"#1B3A5C":"#fff",color:countryFilter===v?"#fff":"#5D6D7E",borderColor:countryFilter===v?"#1B3A5C":"#D5D8DC"}}>{l}</span>
            ))}
            <span style={{width:1,height:24,background:"#D5D8DC",margin:"0 4px"}}/>
            <span style={{fontSize:13,fontWeight:600,color:"#7F8C8D",alignSelf:"center",marginRight:4}}>Relevanz:</span>
            {[["all",`Alle (${Object.keys(INDUSTRIES).length})`],["core",`Kern (${priorityCounts.core})`],["important",`Wichtig (${priorityCounts.important})`],["niche",`Nische (${priorityCounts.niche})`]].map(([v,l])=>(
              <span key={v} className="pill" onClick={()=>setPriorityFilter(v)}
                style={{background:priorityFilter===v?"#2E86C1":"#fff",color:priorityFilter===v?"#fff":"#5D6D7E",borderColor:priorityFilter===v?"#2E86C1":"#D5D8DC"}}>{l}</span>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:14,marginBottom:28}}>
            {filteredIndustries.map(([key, ind], i) => (
              <div key={key} className="card"
                onClick={() => { setSelectedIndustry(key); setStep("configure"); }}
                onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)}
                style={{background:"#fff",borderRadius:14,padding:"22px 20px",border:hovered===key?`2px solid ${ind.color}`:"2px solid #E8EDF2",boxShadow:"0 2px 10px rgba(0,0,0,.03)",animation:`fadeUp .4s ease-out ${i*.04}s both`,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:hovered===key?ind.gradient:"transparent",transition:"all .3s"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <span style={{fontSize:28}}>{ind.icon}</span>
                  <div style={{display:"flex",gap:4}}>
                    {ind.country.includes("DE")&&<span style={{fontSize:10,background:"#FDEBD0",color:"#E67E22",padding:"2px 6px",borderRadius:4,fontWeight:700}}>DE</span>}
                    {ind.country.includes("CH")&&<span style={{fontSize:10,background:"#D5F5E3",color:"#27AE60",padding:"2px 6px",borderRadius:4,fontWeight:700}}>CH</span>}
                  </div>
                </div>
                <h3 style={{fontSize:15,fontWeight:700,color:"#1B3A5C",marginBottom:4}}>{ind.label}</h3>
                <p style={{fontSize:12,color:"#7F8C8D",lineHeight:1.4,marginBottom:12}}>{ind.desc}</p>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:ind.color,fontWeight:600}}>{ind.specificQuestions.reduce((s,sq)=>s+sq.questions.length,0)} Fragen</span>
                  <span style={{fontSize:14,color:ind.color}}>→</span>
                </div>
              </div>
            ))}
          </div>

          {filteredIndustries.length === 0 && (
            <div style={{textAlign:"center",padding:40,color:"#95A5A6"}}>Keine Branchen für den gewählten Filter gefunden.</div>
          )}

          <div style={{textAlign:"center"}}>
            <button className="btn" onClick={()=>{setSelectedIndustry(null);setStep("fill");setShowIndQ(false)}}
              style={{background:"transparent",border:"2px dashed #BDC3C7",borderRadius:10,padding:"12px 28px",fontSize:14,color:"#7F8C8D",fontWeight:500}}>
              Ohne Branchenauswahl fortfahren →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════ STEP: CONFIGURE ═══════
  if (step === "configure") {
    return (
      <div style={{minHeight:"100vh",background:"#F7F9FC",position:"relative"}}>
        <AnimBG/><style>{gStyle}</style>
        <div style={{position:"relative",zIndex:1,maxWidth:700,margin:"0 auto",padding:"40px 24px"}}>
          <button onClick={()=>setStep("select")} style={{background:"none",border:"none",color:"#2E86C1",fontSize:14,cursor:"pointer",marginBottom:20,fontWeight:500}}>← Branchenauswahl</button>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:28,animation:"fadeUp .5s ease-out"}}>
            <div style={{width:52,height:52,borderRadius:13,background:industry.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{industry.icon}</div>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,color:"#1B3A5C"}}>{industry.label}</h1>
              <p style={{fontSize:13,color:"#7F8C8D"}}>{industry.desc}</p>
              <div style={{display:"flex",gap:4,marginTop:4}}>
                {industry.country.includes("DE")&&<span style={{fontSize:10,background:"#FDEBD0",color:"#E67E22",padding:"2px 6px",borderRadius:4,fontWeight:700}}>🇩🇪 Deutschland</span>}
                {industry.country.includes("CH")&&<span style={{fontSize:10,background:"#D5F5E3",color:"#27AE60",padding:"2px 6px",borderRadius:4,fontWeight:700}}>🇨🇭 Schweiz</span>}
              </div>
            </div>
          </div>

          <div style={{background:"#fff",borderRadius:14,padding:22,marginBottom:14,border:"1px solid #E8EDF2",animation:"fadeUp .5s ease-out .1s both"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:"#1B3A5C"}}>{industry.icon} Branchenspezifische Fragen</h3>
                <p style={{fontSize:12,color:"#7F8C8D",marginTop:3}}>{industry.specificQuestions.reduce((s,sq)=>s+sq.questions.length,0)} zusätzliche Fragen</p>
              </div>
              <Toggle on={showIndQ} onToggle={()=>setShowIndQ(!showIndQ)} color={industry.color}/>
            </div>
            {showIndQ && (
              <div style={{marginTop:10,borderTop:"1px solid #E8EDF2",paddingTop:10}}>
                {industry.specificQuestions.map((sq,i)=>(
                  <div key={i} style={{fontSize:12,color:"#5D6D7E",padding:"3px 0"}}><span style={{fontWeight:600}}>{sq.section}</span> — {sq.questions.length} Fragen</div>
                ))}
              </div>
            )}
          </div>

          <div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #E8EDF2",animation:"fadeUp .5s ease-out .2s both"}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#1B3A5C",marginBottom:14}}>📋 Standardabschnitte</h3>
            {CORE_SECTIONS.map(s=>(
              <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F2F3F4"}}>
                <div><span style={{fontSize:13,color:"#1B3A5C",fontWeight:500}}>{s.title}</span><span style={{fontSize:11,color:"#95A5A6",marginLeft:6}}>{s.questions.length}</span></div>
                <Toggle on={enabledCore[s.id]} onToggle={()=>setEnabledCore(p=>({...p,[s.id]:!p[s.id]}))}/>
              </div>
            ))}
          </div>

          <div style={{textAlign:"center",marginTop:28,animation:"fadeUp .5s ease-out .3s both"}}>
            <div style={{fontSize:13,color:"#7F8C8D",marginBottom:10}}>Gesamt: <strong style={{color:"#1B3A5C"}}>{totalQ} Fragen</strong> in {allSections.length} Abschnitten</div>
            <button className="btn" onClick={()=>{setStep("fill");setActiveSection(0)}}
              style={{background:"linear-gradient(135deg,#1B3A5C,#2E86C1)",color:"#fff",border:"none",borderRadius:11,padding:"14px 44px",fontSize:15,fontWeight:700,boxShadow:"0 4px 16px rgba(30,60,114,.15)"}}>
              Fragebogen starten →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════ STEP: FILL & EXPORT ═══════
  return (
    <div style={{minHeight:"100vh",background:"#F7F9FC",position:"relative"}}>
      <AnimBG/><style>{gStyle}</style>
      
      {/* Floating AI Assistant Panel */}
      {!exportDone && allSections[activeSection] && (
        <SectionAIPanel
          section={allSections[activeSection]}
          answers={answers}
          industry={industry}
          language={language}
          customerName={answers['general_0'] || assessment?.customer_name || ''}
          userId={user?.id}
          assessmentId={assessment?.id}
          sections={allSections}
          // Action callbacks for navigational AI
          onFillAnswers={(newAnswers) => {
            // Merge new answers with existing ones
            setAnswers(prev => ({ ...prev, ...newAnswers }));
          }}
          onExport={(format) => {
            const rd = computeReadinessFromAnswers(answers);
            if (format === 'pdf') {
              exportToPDF(allSections, answers, industry, rd, language);
            } else if (format === 'docx' || format === 'word') {
              exportToWord(allSections, answers, industry, rd, language);
            } else if (format === 'pptx') {
              generatePowerPoint(assessment || { customer_name: answers['general_0'] || 'Customer', industry: selectedIndustry }, answers, language);
            }
          }}
          onNavigate={(sectionId) => {
            // Find section index by ID
            const idx = allSections.findIndex(s => s.id === sectionId);
            if (idx >= 0) {
              setActiveSection(idx);
              setShowRecommendations(false);
              setExportDone(false);
            }
          }}
        />
      )}
      
      <div style={{position:"relative",zIndex:1,display:"flex",minHeight:"100vh"}}>
        {/* Sidebar */}
        <div style={{width:268,background:"#fff",borderRight:"1px solid #E8EDF2",padding:"16px 0",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"0 16px",marginBottom:16}}>
            {/* Real-time Collaboration Indicator */}
            {assessment?.id && (
              <div style={{marginBottom:12}}>
                <PresenceIndicator 
                  activeUsers={activeUsers}
                  isConnected={realtimeEnabled}
                  currentSection={allSections[activeSection]?.id}
                />
              </div>
            )}
            
            {/* Dashboard Button - only show when editing existing assessment */}
            {onNavigateToDashboard && assessment && (
              <button 
                onClick={onNavigateToDashboard} 
                style={{
                  background:"linear-gradient(135deg,#1B3A5C,#2E86C1)",
                  border:"none",
                  color:"#fff",
                  fontSize:12,
                  cursor:"pointer",
                  fontWeight:600,
                  marginBottom:12,
                  padding:"8px 14px",
                  borderRadius:8,
                  display:"flex",
                  alignItems:"center",
                  gap:6,
                  width:"100%",
                  justifyContent:"center",
                }}
              >
                ← Dashboard
              </button>
            )}
            {/* Back to previous step button */}
            {!assessment && (
              <button onClick={()=>setStep(selectedIndustry?"configure":"select")} style={{background:"none",border:"none",color:"#2E86C1",fontSize:12,cursor:"pointer",fontWeight:500,marginBottom:10}}>← Zurück</button>
            )}
            {industry&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:7,background:industry.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{industry.icon}</div>
                <span style={{fontSize:12,fontWeight:700,color:"#1B3A5C"}}>{industry.label}</span>
              </div>
            )}
            <div style={{background:"#E8EDF2",borderRadius:5,height:7,marginBottom:5,overflow:"hidden"}}>
              <div style={{background:"linear-gradient(90deg,#2E86C1,#27AE60)",height:"100%",borderRadius:5,width:`${progress}%`,transition:"width .5s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:11,color:"#7F8C8D"}}>{answeredQ}/{totalQ} {language === 'de' ? 'beantwortet' : 'answered'}</div>
              <LanguageSwitcherCompact />
            </div>
            
            {/* Save Status Indicator */}
            {assessment?.id && (
              <div style={{marginTop:8,padding:"6px 10px",background:saving?"#FEF9E7":"#EAFAF1",borderRadius:6,fontSize:11,color:saving?"#B7950B":"#27AE60",fontWeight:500}}>
                {saving ? "⏳ Speichert..." : lastSaved ? `✓ Gespeichert ${lastSaved.toLocaleTimeString('de-DE')}` : "✓ Bereit"}
              </div>
            )}
          </div>

          <div style={{flex:1,overflowY:"auto"}}>
            {/* Group sections into clusters */}
            {(() => {
              // Define core section clusters
              const coreClusters = [
                { id: 'basics', label: '📋 Grundlagen', icon: '📋', sections: ['general'] },
                { id: 'sap', label: '💻 SAP Systeme', icon: '💻', sections: ['landscape', 'licensing', 'btp', 'cloud'] },
                { id: 'ai', label: '🤖 KI & Daten', icon: '🤖', sections: ['aiSap', 'aiNonSap', 'data'] },
                { id: 'org', label: '🏢 Organisation', icon: '🏢', sections: ['security', 'org', 'useCases'] },
              ];
              
              // Build grouped sections for core clusters
              const groupedCoreSections = coreClusters.map(cluster => ({
                ...cluster,
                items: allSections.map((s, i) => ({ ...s, originalIndex: i })).filter(s => cluster.sections.includes(s.id))
              })).filter(cluster => cluster.items.length > 0);
              
              // Build industry-specific clusters - one per selected industry
              const industryClusters = selectedIndustries.map((indKey, industryIndex) => {
                const ind = INDUSTRIES[indKey];
                if (!ind) return null;
                
                // Get all sections belonging to this industry
                const industrySections = allSections
                  .map((s, i) => ({ ...s, originalIndex: i }))
                  .filter(s => s.isIndustry && s.industryKey === indKey);
                
                if (industrySections.length === 0) return null;
                
                return {
                  id: `industry_${indKey}`,
                  label: `${ind.icon} ${ind.label}`,
                  icon: ind.icon,
                  color: ind.color,
                  isIndustry: true,
                  items: industrySections,
                };
              }).filter(Boolean);
              
              // Combine all clusters
              const allClusters = [...groupedCoreSections, ...industryClusters];
              
              return allClusters.map((cluster, ci) => (
                <div key={cluster.id} style={{marginBottom:4}}>
                  {/* Cluster Header */}
                  <div style={{
                    padding:"8px 16px",
                    fontSize:10,
                    fontWeight:700,
                    color:cluster.isIndustry ? (cluster.color || "#8E44AD") : "#7F8C8D",
                    textTransform:"uppercase",
                    letterSpacing:"0.5px",
                    background:cluster.isIndustry ? `${cluster.color || "#8E44AD"}08` : "#F7F9FC",
                    borderTop:ci > 0 ? "1px solid #E8EDF2" : "none",
                    marginTop:ci > 0 ? 4 : 0,
                    display:"flex",
                    alignItems:"center",
                    gap:6,
                  }}>
                    {cluster.isIndustry && (
                      <span style={{
                        display:"inline-flex",
                        alignItems:"center",
                        justifyContent:"center",
                        width:18,
                        height:18,
                        borderRadius:4,
                        background:cluster.color || "#8E44AD",
                        fontSize:10,
                      }}>
                        {cluster.icon}
                      </span>
                    )}
                    <span style={{
                      overflow:"hidden",
                      textOverflow:"ellipsis",
                      whiteSpace:"nowrap",
                    }}>
                      {cluster.isIndustry ? cluster.label.replace(cluster.icon, '').trim() : cluster.label}
                    </span>
                  </div>
                  {/* Cluster Items */}
                  {cluster.items.map((s) => {
                    const sAns = s.questions.filter((_,qi)=>answers[`${s.id}_${qi}`]?.trim()).length;
                    const active = activeSection===s.originalIndex && !showRecommendations;
                    const canEdit = canEditSection(s.id);
                    const itemColor = s.industryColor || cluster.color || "#1B3A5C";
                    return (
                      <div key={s.id} className="nav" onClick={()=>{setActiveSection(s.originalIndex);setShowRecommendations(false);setExportDone(false)}}
                        style={{
                          padding:"7px 16px 7px 24px",
                          background:active?"#EBF5FB":(!canEdit?"#F7F9FC":"transparent"),
                          borderRight:active?`3px solid ${s.isIndustry ? itemColor : "#2E86C1"}`:"3px solid transparent",
                          display:"flex",
                          alignItems:"center",
                          justifyContent:"space-between",
                          cursor:"pointer",
                          transition:"all .2s",
                          opacity:canEdit?1:0.6,
                        }}>
                        <div style={{display:"flex",alignItems:"center",gap:4,flex:1,minWidth:0}}>
                          {!canEdit && <span style={{fontSize:10,opacity:0.7}}>🔒</span>}
                          <span style={{
                            fontSize:11,
                            fontWeight:active?700:500,
                            color:!canEdit?"#95A5A6":(s.isIndustry?itemColor:"#1B3A5C"),
                            lineHeight:1.3,
                            overflow:"hidden",
                            textOverflow:"ellipsis",
                            whiteSpace:"nowrap",
                          }}>{s.title.replace(/^[^\s]+\s/, '')}</span>
                        </div>
                        <span style={{fontSize:10,color:sAns===s.questions.length&&sAns>0?"#27AE60":"#95A5A6",fontWeight:600,marginLeft:6,whiteSpace:"nowrap"}}>{sAns}/{s.questions.length}</span>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* Section Assignments (only for assessment owner) */}
          {assessment?.id && isOwner && collaborators.length > 0 && (
            <div style={{padding:"12px 16px",borderTop:"1px solid #E8EDF2"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#1B3A5C",marginBottom:8}}>👥 Team-Zuweisung für diesen Abschnitt</div>
              <MultiSelectDropdown
                options={collaborators.map(c => ({
                  id: c.id,
                  label: c.full_name || c.email?.split('@')[0] || 'Unbekannt',
                  sublabel: c.email,
                }))}
                selected={sectionAssignments[allSections[activeSection]?.id]?.assignees || []}
                onChange={(selectedIds) => {
                  const sec = allSections[activeSection];
                  if (sec) {
                    assignSectionMultiple(sec.id, sec.title, selectedIds);
                  }
                }}
                placeholder="Team-Mitglieder auswählen..."
                searchPlaceholder="Name oder E-Mail suchen..."
                emptyMessage="Keine Personen gefunden"
                maxDisplay={2}
              />
              {sectionAssignments[allSections[activeSection]?.id]?.assignees?.length > 0 && (
                <div style={{marginTop:8,fontSize:10,color:"#7F8C8D"}}>
                  {sectionAssignments[allSections[activeSection]?.id]?.assignees?.length} Person(en) zugewiesen
                </div>
              )}
            </div>
          )}

          <div style={{padding:"12px 16px",borderTop:"1px solid #E8EDF2"}}>
            <button className="btn" onClick={()=>setExportDone(true)}
              style={{width:"100%",background:exportDone?"linear-gradient(135deg,#27AE60,#1E8449)":"linear-gradient(135deg,#1B3A5C,#2E86C1)",color:"#fff",border:"none",borderRadius:9,padding:10,fontSize:13,fontWeight:700,boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}>
              {exportDone?"✅ Zusammenfassung":"📄 Zusammenfassung"}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{flex:1,display:"flex",gap:24,padding:"28px 36px",minWidth:0,overflowY:"auto"}}>
          {/* Questions Column */}
          <div ref={contentRef} style={{flex:1,maxWidth:exportDone || showRecommendations ? 780 : 640,minWidth:0}}>
          {/* AI Recommendations View */}
          {showRecommendations && assessment?.id ? (
            <div style={{animation:"fadeUp .5s ease-out"}}>
              <div style={{marginBottom:24}}>
                <div style={{display:"inline-block",background:"linear-gradient(135deg,#8E44AD15,#9B59B615)",border:"1.5px solid #8E44AD40",borderRadius:7,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#8E44AD",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
                  KI-generiert
                </div>
                <h2 style={{fontSize:20,fontWeight:800,color:"#1B3A5C"}}>🤖 {language === 'en' ? 'AI Recommendations' : 'AI Empfehlungen'}</h2>
                <p style={{fontSize:12,color:"#95A5A6",marginTop:3}}>
                  {language === 'en' ? 'Personalized recommendations based on your assessment answers' : 'Personalisierte Handlungsempfehlungen basierend auf Ihren Assessment-Antworten'}
                </p>
              </div>
              
              {/* Language Selector */}
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8,background:'#fff',padding:'8px 12px',borderRadius:8,border:'1px solid #E8EDF2'}}>
                  <span style={{fontSize:12,color:'#7F8C8D',fontWeight:500}}>🌐 Sprache:</span>
                  <button
                    onClick={() => setLanguage('de')}
                    style={{
                      padding:'4px 10px',
                      borderRadius:6,
                      border:'none',
                      background:language==='de'?'#8E44AD':'transparent',
                      color:language==='de'?'#fff':'#5D6D7E',
                      fontSize:12,
                      fontWeight:600,
                      cursor:'pointer',
                    }}
                  >
                    🇩🇪 DE
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    style={{
                      padding:'4px 10px',
                      borderRadius:6,
                      border:'none',
                      background:language==='en'?'#8E44AD':'transparent',
                      color:language==='en'?'#fff':'#5D6D7E',
                      fontSize:12,
                      fontWeight:600,
                      cursor:'pointer',
                    }}
                  >
                    🇬🇧 EN
                  </button>
                </div>
              </div>
              
              {/* AI Recommendations Component */}
              <Recommendations 
                assessment={assessment}
                answers={answers}
                language={language}
              />
              
              <div style={{textAlign:"center",marginTop:28,paddingBottom:32}}>
                <button className="btn" onClick={()=>setShowRecommendations(false)}
                  style={{background:"#fff",color:"#8E44AD",border:"2px solid #8E44AD",borderRadius:9,padding:"10px 28px",fontSize:13,fontWeight:600}}>
                  ← Zurück zum Fragebogen
                </button>
              </div>
            </div>
          ) : exportDone ? (
            <div style={{animation:"fadeUp .5s ease-out"}}>
              <div style={{textAlign:"center",marginBottom:28}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#27AE60,#1E8449)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:12,color:"#fff"}}>✓</div>
                <h2 style={{fontSize:22,fontWeight:800,color:"#1B3A5C"}}>{language === 'en' ? 'Readiness Check Summary' : 'Readiness Check Zusammenfassung'}</h2>
                <p style={{color:"#7F8C8D",fontSize:13,marginTop:6}}>
                  {industry?.label||(language === 'en' ? 'General' : 'Allgemein')} — {new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'de-DE')} — {answeredQ}/{totalQ} {language === 'en' ? 'answered' : 'beantwortet'}
                </p>
              </div>

              {/* ═══ AI READINESS ASSESSMENT ═══ */}
              {(() => {
                const rd = computeReadinessFromAnswers(answers);
                const overall = Math.round((rd.sap + rd.btp + rd.data) / 3);
                const oCol = overall >= 66 ? "#27AE60" : overall >= 33 ? "#F39C12" : "#E74C3C";
                const expT = EXPORT_TRANSLATIONS[language] || EXPORT_TRANSLATIONS.de;
                return (
                  <div style={{background:"#fff",borderRadius:16,padding:"28px 24px",marginBottom:28,border:"2px solid #E8EDF2",boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
                    <div style={{textAlign:"center",marginBottom:20}}>
                      <h3 style={{fontSize:18,fontWeight:800,color:"#1B3A5C",marginBottom:4}}>🎯 {expT.aiReadinessAssessment}</h3>
                      <p style={{fontSize:12,color:"#7F8C8D"}}>{language === 'en' ? 'Automatic assessment based on your answers' : 'Automatische Bewertung basierend auf Ihren Antworten'}</p>
                    </div>
                    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
                      <GaugeMeter value={rd.sap} label={expT.sapSystem} sublabel={expT.sapSub}/>
                      <GaugeMeter value={rd.btp} label={expT.btpPlatform} sublabel={expT.btpSub}/>
                      <GaugeMeter value={rd.data} label={expT.dataMaturity} sublabel={expT.dataSub}/>
                    </div>
                    <div style={{textAlign:"center",padding:"16px 20px",background:overall>=66?"#EAFAF1":overall>=33?"#FEF9E7":"#FDEDEC",borderRadius:12,border:`1.5px solid ${oCol}30`}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#5D6D7E",marginBottom:4}}>{expT.overallRating}</div>
                      <div style={{fontSize:28,fontWeight:800,color:oCol}}>{overall}%</div>
                      <div style={{fontSize:12,color:oCol,fontWeight:600,marginTop:2}}>
                        {overall >= 66 ? expT.goodForAI :
                         overall >= 33 ? expT.basicsPresent :
                         expT.significantAction}
                      </div>
                      {rd.sap < 33 && <div style={{fontSize:11,color:"#E74C3C",marginTop:8}}>⚠️ {expT.sapMigration}</div>}
                      {rd.btp < 33 && <div style={{fontSize:11,color:"#E74C3C",marginTop:4}}>⚠️ {expT.btpRequired}</div>}
                      {rd.data < 33 && <div style={{fontSize:11,color:"#E74C3C",marginTop:4}}>⚠️ {expT.dataStrategy}</div>}
                      {rd.sap >= 33 && rd.sap < 66 && <div style={{fontSize:11,color:"#F39C12",marginTop:8}}>💡 {expT.sapJoule}</div>}
                      {rd.btp >= 33 && rd.btp < 66 && <div style={{fontSize:11,color:"#F39C12",marginTop:4}}>💡 {expT.btpEvaluate}</div>}
                      {rd.data >= 33 && rd.data < 66 && <div style={{fontSize:11,color:"#F39C12",marginTop:4}}>💡 {expT.dataGovernance}</div>}
                    </div>
                  </div>
                );
              })()}

              {/* Heat Map Visualization */}
              {(() => {
                const rd = computeReadinessFromAnswers(answers);
                return (
                  <div style={{background:"#fff",borderRadius:16,padding:"24px",marginBottom:28,border:"1px solid #E8EDF2",boxShadow:"0 4px 20px rgba(0,0,0,0.04)"}}>
                    <HeatMap 
                      scores={rd}
                      answers={answers}
                      industry={industry}
                      showLegend={true}
                    />
                  </div>
                );
              })()}

              {/* Risk Assessment Matrix */}
              {(() => {
                const rd = computeReadinessFromAnswers(answers);
                return (
                  <div style={{background:"#fff",borderRadius:16,padding:"24px",marginBottom:28,border:"1px solid #E8EDF2",boxShadow:"0 4px 20px rgba(0,0,0,0.04)"}}>
                    <RiskMatrix 
                      answers={answers}
                      scores={rd}
                      industry={industry}
                      showMatrix={true}
                    />
                  </div>
                );
              })()}

              {/* Language Selector & AI Recommendations */}
              {assessment?.id && (
                <div style={{marginBottom:28}}>
                  {/* Language Selector */}
                  <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,background:'#fff',padding:'8px 12px',borderRadius:8,border:'1px solid #E8EDF2'}}>
                      <span style={{fontSize:12,color:'#7F8C8D',fontWeight:500}}>🌐 Sprache:</span>
                      <button
                        onClick={() => setLanguage('de')}
                        style={{
                          padding:'4px 10px',
                          borderRadius:6,
                          border:'none',
                          background:language==='de'?'#1B3A5C':'transparent',
                          color:language==='de'?'#fff':'#5D6D7E',
                          fontSize:12,
                          fontWeight:600,
                          cursor:'pointer',
                        }}
                      >
                        🇩🇪 DE
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        style={{
                          padding:'4px 10px',
                          borderRadius:6,
                          border:'none',
                          background:language==='en'?'#1B3A5C':'transparent',
                          color:language==='en'?'#fff':'#5D6D7E',
                          fontSize:12,
                          fontWeight:600,
                          cursor:'pointer',
                        }}
                      >
                        🇬🇧 EN
                      </button>
                    </div>
                  </div>
                  
                  {/* AI Recommendations Component */}
                  <Recommendations 
                    assessment={assessment}
                    answers={answers}
                    language={language}
                  />
                </div>
              )}

              {allSections.map(s=>(
                <div key={s.id} style={{marginBottom:20,background:"#fff",borderRadius:12,border:s.isIndustry?`2px solid ${industry?.color||"#2E86C1"}30`:"1px solid #E8EDF2",overflow:"hidden"}}>
                  <div style={{padding:"12px 18px",background:s.isIndustry?`${industry?.color||"#2E86C1"}10`:"#FAFBFC",borderBottom:"1px solid #E8EDF2"}}>
                    <h3 style={{fontSize:14,fontWeight:700,color:s.isIndustry?(industry?.color||"#1B3A5C"):"#1B3A5C"}}>{s.title}</h3>
                  </div>
                  <div style={{padding:"12px 18px"}}>
                    {s.questions.map((q,qi)=>{
                      const ans=answers[`${s.id}_${qi}`];
                      return(
                        <div key={qi} style={{padding:"6px 0",borderBottom:qi<s.questions.length-1?"1px solid #F2F3F4":"none"}}>
                          <div style={{fontSize:12,fontWeight:600,color:"#1B3A5C",marginBottom:2}}>{q.q}</div>
                          <div style={{fontSize:12,color:ans?.trim()?"#2C3E50":"#BDC3C7",fontStyle:ans?.trim()?"normal":"italic"}}>{ans?.trim()||"— nicht beantwortet —"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{textAlign:"center",marginTop:20,paddingBottom:32}}>
                {/* Export Language Info */}
                <div style={{marginBottom:16,padding:"10px 16px",background:"#EBF5FB",borderRadius:10,display:"inline-flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14}}>🌐</span>
                  <span style={{fontSize:12,color:"#2E86C1",fontWeight:500}}>
                    {language === 'de' ? 'Export in Deutsch' : 'Export in English'}
                  </span>
                  <span style={{fontSize:11,color:"#7F8C8D"}}>
                    ({language === 'de' ? 'Sprache oben ändern' : 'Change language above'})
                  </span>
                </div>
                
                {/* Export buttons */}
                <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:16}}>
                  <button className="btn" onClick={() => {
                    const rd = computeReadinessFromAnswers(answers);
                    exportToWord(allSections, answers, industry, rd, language);
                  }}
                    style={{background:"linear-gradient(135deg,#2471A3,#2E86C1)",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px rgba(46,134,193,0.2)"}}>
                    <span style={{fontSize:18}}>📝</span> {language === 'de' ? 'Word exportieren (.doc)' : 'Export Word (.doc)'}
                  </button>
                  <button className="btn" onClick={() => {
                    const rd = computeReadinessFromAnswers(answers);
                    exportToPDF(allSections, answers, industry, rd, language);
                  }}
                    style={{background:"linear-gradient(135deg,#C0392B,#E74C3C)",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px rgba(231,76,60,0.2)"}}>
                    <span style={{fontSize:18}}>📄</span> {language === 'de' ? 'PDF exportieren' : 'Export PDF'}
                  </button>
                  <button className="btn" onClick={async () => {
                    try {
                      await generatePowerPoint(assessment || { customer_name: answers['general_0'] || 'Customer', industry: selectedIndustry }, answers, language);
                    } catch (error) {
                      console.error('PowerPoint generation error:', error);
                      alert(language === 'de' ? 'Fehler beim Erstellen der PowerPoint-Präsentation' : 'Error creating PowerPoint presentation');
                    }
                  }}
                    style={{background:"linear-gradient(135deg,#E67E22,#F39C12)",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px rgba(230,126,34,0.2)"}}>
                    <span style={{fontSize:18}}>📊</span> {language === 'de' ? 'PowerPoint exportieren' : 'Export PowerPoint'}
                  </button>
                </div>
                <p style={{fontSize:11,color:"#95A5A6",marginBottom:16}}>
                  {language === 'de' 
                    ? 'Word-Datei wird direkt heruntergeladen. PDF öffnet den Druckdialog — wählen Sie dort "Als PDF speichern".'
                    : 'Word file downloads directly. PDF opens print dialog — select "Save as PDF" there.'}
                </p>
                <button className="btn" onClick={()=>setExportDone(false)}
                  style={{background:"#fff",color:"#2E86C1",border:"2px solid #2E86C1",borderRadius:9,padding:"10px 28px",fontSize:13,fontWeight:600}}>
                  ← Zurück zum Fragebogen
                </button>
              </div>
            </div>
          ) : allSections[activeSection] && (()=>{
            const sec=allSections[activeSection];
            const canEdit = canEditSection(sec.id);
            return(
              <div style={{animation:"fadeUp .4s ease-out"}} key={sec.id}>
                <div style={{marginBottom:24}}>
                  {sec.isIndustry&&<div style={{display:"inline-block",background:`${industry?.color}15`,border:`1.5px solid ${industry?.color}40`,borderRadius:7,padding:"3px 10px",fontSize:10,fontWeight:700,color:industry?.color,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Branchenspezifisch</div>}
                  <h2 style={{fontSize:20,fontWeight:800,color:"#1B3A5C"}}>{sec.title}</h2>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginTop:3}}>
                    <p style={{fontSize:12,color:"#95A5A6"}}>Abschnitt {activeSection+1} von {allSections.length}</p>
                    {!canEdit && (
                      <span style={{
                        display:"inline-flex",
                        alignItems:"center",
                        gap:4,
                        padding:"3px 10px",
                        background:"#FEF9E7",
                        border:"1px solid #F39C12",
                        borderRadius:12,
                        fontSize:10,
                        fontWeight:600,
                        color:"#B7950B",
                      }}>
                        🔒 Nur Lesezugriff
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Read-only notice */}
                {!canEdit && (
                  <div style={{
                    background:"#FEF9E7",
                    border:"1px solid #F39C1240",
                    borderRadius:10,
                    padding:"12px 16px",
                    marginBottom:20,
                    display:"flex",
                    alignItems:"flex-start",
                    gap:10,
                  }}>
                    <span style={{fontSize:18}}>🔒</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#B7950B",marginBottom:2}}>
                        Dieser Abschnitt ist für Sie schreibgeschützt
                      </div>
                      <div style={{fontSize:11,color:"#7F8C8D"}}>
                        Sie können die Antworten einsehen, aber nicht bearbeiten. Nur zugewiesene Team-Mitglieder oder der Assessment-Ersteller können diesen Abschnitt bearbeiten.
                      </div>
                    </div>
                  </div>
                )}
                
                {sec.questions.map((q,qi)=>(
                  <div key={qi} style={{
                    marginBottom:16,
                    background:canEdit?"#fff":"#FAFBFC",
                    borderRadius:11,
                    padding:"18px 20px",
                    border:canEdit?"1px solid #E8EDF2":"1px solid #E8EDF2",
                    animation:`fadeUp .3s ease-out ${qi*.04}s both`,
                    opacity:canEdit?1:0.85,
                  }}>
                    <label style={{display:"block",fontSize:14,fontWeight:600,color:"#1B3A5C",marginBottom:4}}>{q.q}</label>
                    {q.hint&&<div style={{fontSize:11,color:"#95A5A6",marginBottom:8,fontStyle:"italic"}}>{q.hint}</div>}
                    {q.type==="text"?(
                      <input 
                        type="text" 
                        value={answers[`${sec.id}_${qi}`]||""} 
                        onChange={e=>canEdit && handleAnswer(sec.id,qi,e.target.value)} 
                        placeholder={canEdit ? t('questionnaire.placeholder.text') : t('common.labels.notAnswered')}
                        readOnly={!canEdit}
                        style={{
                          width:"100%",
                          padding:"9px 12px",
                          borderRadius:7,
                          border:"1.5px solid #D5D8DC",
                          fontSize:13,
                          background:canEdit?"#FAFBFC":"#F2F3F4",
                          transition:"all .2s",
                          cursor:canEdit?"text":"not-allowed",
                          color:canEdit?"#2C3E50":"#7F8C8D",
                        }}
                      />
                    ):(
                      <textarea 
                        value={answers[`${sec.id}_${qi}`]||""} 
                        onChange={e=>canEdit && handleAnswer(sec.id,qi,e.target.value)} 
                        placeholder={canEdit ? t('questionnaire.placeholder.textarea') : t('common.labels.notAnswered')} 
                        rows={3}
                        readOnly={!canEdit}
                        style={{
                          width:"100%",
                          padding:"9px 12px",
                          borderRadius:7,
                          border:"1.5px solid #D5D8DC",
                          fontSize:13,
                          resize:canEdit?"vertical":"none",
                          background:canEdit?"#FAFBFC":"#F2F3F4",
                          transition:"all .2s",
                          cursor:canEdit?"text":"not-allowed",
                          color:canEdit?"#2C3E50":"#7F8C8D",
                        }}
                      />
                    )}
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:28,paddingBottom:32}}>
                  <button onClick={()=>setActiveSection(Math.max(0,activeSection-1))} disabled={activeSection===0}
                    style={{background:activeSection===0?"#E8EDF2":"#fff",color:activeSection===0?"#BDC3C7":"#2E86C1",border:activeSection===0?"none":"2px solid #2E86C1",borderRadius:9,padding:"10px 24px",fontSize:13,fontWeight:600,cursor:activeSection===0?"default":"pointer"}}>
                    ← Zurück
                  </button>
                  <button className="btn" onClick={()=>setActiveSection(Math.min(allSections.length-1,activeSection+1))} disabled={activeSection===allSections.length-1}
                    style={{background:activeSection===allSections.length-1?"#E8EDF2":"linear-gradient(135deg,#1B3A5C,#2E86C1)",color:activeSection===allSections.length-1?"#BDC3C7":"#fff",border:"none",borderRadius:9,padding:"10px 24px",fontSize:13,fontWeight:600,cursor:activeSection===allSections.length-1?"default":"pointer",boxShadow:activeSection===allSections.length-1?"none":"0 4px 12px rgba(0,0,0,.1)"}}>
                    Weiter →
                  </button>
                </div>
              </div>
            );
          })()}
          </div>
          
          {/* Right Side: AI Recommendations Panel */}
          {!exportDone && !showRecommendations && allSections[activeSection] && (
            <div style={{width:340,flexShrink:0,position:"sticky",top:0,alignSelf:"flex-start"}}>
              <SectionRecommendations
                section={allSections[activeSection]}
                answers={answers}
                industry={industry}
                language={language}
                customerName={answers['general_0'] || assessment?.customer_name || ''}
              />
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
