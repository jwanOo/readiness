/**
 * English translations for AI Readiness Check
 */
export default {
  // ═══════════════════════════════════════════════════════════════
  // COMMON UI STRINGS
  // ═══════════════════════════════════════════════════════════════
  common: {
    appName: "AI Readiness Check",
    buttons: {
      save: "Save",
      saveDraft: "Save Draft",
      cancel: "Cancel",
      next: "Next",
      previous: "Previous",
      back: "Back",
      skip: "Skip",
      export: "Export",
      complete: "Complete",
      start: "Start",
      continue: "Continue",
      close: "Close",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      download: "Download",
      submit: "Submit",
    },
    status: {
      loading: "Loading...",
      saving: "Saving...",
      saved: "Saved",
      error: "Error",
      success: "Success",
      draft: "Draft",
      inProgress: "In Progress",
      completed: "Completed",
      notStarted: "Not Started",
    },
    labels: {
      yes: "Yes",
      no: "No",
      notAnswered: "— not answered —",
      required: "Required",
      optional: "Optional",
      all: "All",
      none: "None",
      search: "Search...",
      filter: "Filter",
      sort: "Sort",
      date: "Date",
      name: "Name",
      email: "Email",
      industry: "Industry",
      customer: "Customer",
      consultant: "Consultant",
      language: "Language",
    },
    time: {
      today: "Today",
      yesterday: "Yesterday",
      daysAgo: "{{days}} days ago",
      lastUpdated: "Last updated",
      created: "Created",
    },
    validation: {
      required: "This field is required",
      invalidEmail: "Please enter a valid email address",
      minLength: "Minimum {{min}} characters required",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════
  navigation: {
    dashboard: "Dashboard",
    newAssessment: "New Assessment",
    assessments: "Assessments",
    analytics: "Analytics",
    settings: "Settings",
    help: "Help",
    logout: "Logout",
    backToDashboard: "← Dashboard",
    backToSelection: "← Industry Selection",
  },

  // ═══════════════════════════════════════════════════════════════
  // INDUSTRY SELECTION
  // ═══════════════════════════════════════════════════════════════
  industrySelection: {
    title: "Industry-Specific AI Readiness Check",
    subtitle: "Select your customer's industry — based on the complete adesso industry portfolio for Germany and Switzerland.",
    filters: {
      country: "Country:",
      allCountries: "🇩🇪🇨🇭 All",
      germany: "🇩🇪 Germany",
      switzerland: "🇨🇭 Switzerland",
      relevance: "Relevance:",
      allRelevance: "All",
      core: "Core",
      important: "Important",
      niche: "Niche",
    },
    noResults: "No industries found for the selected filter.",
    continueWithout: "Continue without industry selection →",
    questionsCount: "{{count}} questions",
  },

  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION STEP
  // ═══════════════════════════════════════════════════════════════
  configuration: {
    title: "Configure Assessment",
    industryQuestions: "Industry-Specific Questions",
    additionalQuestions: "{{count}} additional questions",
    standardSections: "📋 Standard Sections",
    totalQuestions: "Total: {{count}} questions in {{sections}} sections",
    startQuestionnaire: "Start Questionnaire →",
  },

  // ═══════════════════════════════════════════════════════════════
  // QUESTIONNAIRE
  // ═══════════════════════════════════════════════════════════════
  questionnaire: {
    progress: "{{answered}}/{{total}} answered",
    sectionOf: "Section {{current}} of {{total}}",
    questionOf: "Question {{current}} of {{total}}",
    industrySpecific: "Industry-specific",
    readOnly: "Read-only",
    readOnlyNotice: "This section is read-only for you",
    readOnlyDescription: "You can view the answers but cannot edit them. Only assigned team members or the assessment creator can edit this section.",
    placeholder: {
      text: "Please enter...",
      textarea: "Please describe...",
    },
    navigation: {
      previousSection: "← Previous Section",
      nextSection: "Next Section →",
    },
    clusters: {
      basics: "📋 Basics",
      sapSystems: "💻 SAP Systems",
      aiData: "🤖 AI & Data",
      organization: "🏢 Organization",
      industry: "Industry",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY / EXPORT
  // ═══════════════════════════════════════════════════════════════
  summary: {
    title: "Readiness Check Summary",
    subtitle: "{{industry}} — {{date}} — {{answered}}/{{total}} answered",
    assessment: {
      title: "🎯 AI Readiness Assessment",
      subtitle: "Automatic evaluation based on your answers",
      overallRating: "Overall AI Readiness Rating",
      aiReady: "Your organization is well positioned for SAP Business AI",
      partiallyReady: "Basics in place — targeted measures recommended",
      notReady: "Significant action required before AI implementation",
    },
    scores: {
      sapSystem: "SAP System",
      sapSub: "S/4HANA, Clean Core, Joule",
      btpPlatform: "BTP & AI Platform",
      btpSub: "AI Core, Datasphere, BDC",
      dataMaturity: "Data Maturity",
      dataSub: "Quality, Governance, DWH",
    },
    recommendations: {
      title: "Recommendations:",
      sapMigration: "SAP System: Migration to S/4HANA and Clean Core strategy recommended",
      btpRequired: "BTP: SAP BTP with AI Core and CPEA/BTPEA licensing required",
      dataStrategy: "Data: Data strategy, Data Governance and central DWH needed",
      sapJoule: "SAP: Activate Joule and advance Clean Core strategy",
      btpEvaluate: "BTP: Evaluate SAP AI Core and SAP Business Data Cloud",
      dataGovernance: "Data: Strengthen Data Governance and introduce SAP Datasphere",
      sapReady: "SAP System is AI-ready",
      btpReady: "BTP & AI Platform are ready for use",
      dataReady: "Data maturity supports AI initiatives",
    },
    export: {
      title: "Export Options",
      languageInfo: "Export in {{language}}",
      changeLanguage: "Change language above",
      wordExport: "Export Word (.doc)",
      pdfExport: "Export PDF",
      pptxExport: "Export PowerPoint",
      wordHint: "Word file downloads directly. PDF opens print dialog — select \"Save as PDF\" there.",
    },
    backToQuestionnaire: "← Back to Questionnaire",
  },

  // ═══════════════════════════════════════════════════════════════
  // AI RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════
  aiRecommendations: {
    title: "🤖 AI Recommendations",
    subtitle: "Personalized action recommendations based on your assessment answers",
    aiGenerated: "AI-generated",
    loading: "Generating recommendations...",
    error: "Failed to load recommendations",
    retry: "Retry",
  },

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  dashboard: {
    title: "AI Readiness Assessments",
    subtitle: "Manage and track your customer assessments",
    newAssessment: "+ New Assessment",
    searchPlaceholder: "Search assessments...",
    filters: {
      all: "All",
      draft: "Draft",
      inProgress: "In Progress",
      completed: "Completed",
    },
    table: {
      customer: "Customer",
      industry: "Industry",
      status: "Status",
      progress: "Progress",
      lastUpdated: "Last Updated",
      actions: "Actions",
    },
    empty: {
      title: "No assessments yet",
      subtitle: "Create your first AI Readiness assessment to get started.",
      cta: "Create Assessment",
    },
    actions: {
      continue: "Continue",
      view: "View",
      export: "Export",
      delete: "Delete",
      duplicate: "Duplicate",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // TEAM ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════
  teamAssignment: {
    title: "👥 Team Assignment for this Section",
    selectMembers: "Select team members...",
    searchPlaceholder: "Search name or email...",
    noResults: "No people found",
    assigned: "{{count}} person(s) assigned",
  },

  // ═══════════════════════════════════════════════════════════════
  // AI ASSISTANT PANEL
  // ═══════════════════════════════════════════════════════════════
  aiAssistant: {
    title: "AI Assistant",
    thinking: "Thinking...",
    suggestion: "Suggestion",
    hint: "Hint",
    askQuestion: "Ask a question...",
  },

  // ═══════════════════════════════════════════════════════════════
  // INDUSTRIES
  // ═══════════════════════════════════════════════════════════════
  industries: {
    insurance: {
      label: "Insurance / Reinsurance",
      desc: "Property, life, health, reinsurance — adesso core industry with in|sure Ecosphere",
      sections: [
        {
          title: "SAP & Insurance Systems",
          questions: [
            { q: "Do you use SAP FS-CD (Collections & Disbursements) or SAP FI-CA?", hint: "FS-CD = insurance-specific subledger; FI-CA = cross-industry" },
            { q: "Is SAP S/4HANA FPSL (Financial Products Subledger) in use?", hint: "Subledger for IFRS 17 / IFRS 9 reporting" },
            { q: "Do you use adesso in|sure Ecosphere products?", hint: "e.g., in|sure PSLife, in|sure Claims, in|sure Health Claims" },
            { q: "Which policy administration systems are in use?", hint: "e.g., msg, Guidewire, in|sure, custom development" },
          ]
        },
        {
          title: "AI-specific for Insurance",
          questions: [
            { q: "Do you use AI for claims detection / fraud detection?", hint: "e.g., adesso a|advanced fraud management, SAS, custom models" },
            { q: "Is there AI-based straight-through processing?", hint: "Automatic claims processing without manual intervention" },
            { q: "Do you use AI for underwriting / risk assessment?", hint: "" },
            { q: "Are there AI-supported pricing / tariff models?", hint: "" },
            { q: "Do you use AI chatbots or virtual assistants in customer service?", hint: "e.g., for claims reporting, contract information" },
            { q: "Do you use AI for document analysis / OCR in claims processing?", hint: "" },
            { q: "Is telematics data (e.g., vehicle) used for AI models?", hint: "" },
          ]
        },
        {
          title: "Regulatory & Compliance",
          questions: [
            { q: "Which Solvency II requirements affect your AI usage?", hint: "" },
            { q: "How do you handle BaFin regulation for AI in insurance?", hint: "VAIT, MaGo, explainability" },
            { q: "Are there fairness / bias testing requirements for AI models?", hint: "e.g., for pricing, risk selection" },
          ]
        },
      ]
    },
    banking: {
      label: "Banking / Financial Services",
      desc: "Banks, asset management, FinTech, payment services",
      sections: [
        {
          title: "SAP System Landscape Banking",
          questions: [
            { q: "Do you use SAP S/4HANA FPSL (Financial Products Subledger)?", hint: "Successor to SAP Bank Analyzer – Bank Analyzer maintenance end 2025" },
            { q: "Is SAP Payment Engine or SAP Multi-Bank Connectivity (BTP) in use?", hint: "SAP Payment Engine = payment solution for banks" },
            { q: "Do you use SAP GRC (Governance, Risk and Compliance)?", hint: "Access Control, Process Control, Risk Management" },
          ]
        },
        {
          title: "AI-specific for Banking",
          questions: [
            { q: "Do you use AI for fraud detection / anti-money laundering (AML)?", hint: "e.g., SAP, FICO, SAS, custom models" },
            { q: "Is there AI-based credit scoring or risk assessment?", hint: "" },
            { q: "Do you use AI in regulatory reporting or compliance?", hint: "" },
            { q: "Are AI chatbots used in customer service / advisory?", hint: "" },
            { q: "Do you use AI for algorithmic trading or portfolio optimization?", hint: "" },
            { q: "Do you use AI for customer data analysis (Next Best Action)?", hint: "" },
          ]
        },
        {
          title: "Regulatory",
          questions: [
            { q: "Which regulatory requirements apply to AI (BaFin/FINMA, EBA, MaRisk)?", hint: "Switzerland: FINMA circulars, Germany: BaFin" },
            { q: "Are there explainability requirements (Explainable AI / XAI)?", hint: "" },
          ]
        },
      ]
    },
    healthcare: {
      label: "Healthcare / Health",
      desc: "Health insurers (statutory/private), hospitals, medical associations, billing centers",
      sections: [
        {
          title: "SAP & Healthcare Systems",
          questions: [
            { q: "Do you use SAP IS-H (Industry Solution for Healthcare)?", hint: "Patient management, admission/discharge, billing, DRG" },
            { q: "Which HIS (Hospital Information System) is in use?", hint: "e.g., SAP IS-H with i.s.h.med, Cerner, Dedalus ORBIS, Meierhofer" },
            { q: "Do you use SAP industry solutions for health insurance?", hint: "e.g., FI-CA for premium billing, benefits management" },
            { q: "Do you use oscare® or other statutory health insurance solutions?", hint: "oscare® = AOK Systems solution based on SAP" },
          ]
        },
        {
          title: "AI-specific for Healthcare",
          questions: [
            { q: "Do you use AI for benefits verification / billing analysis?", hint: "e.g., fraud detection, plausibility checks" },
            { q: "Are there AI-based applications in patient care?", hint: "e.g., diagnostic support, triage, image analysis" },
            { q: "Do you use AI in data management (Health Data Use Act)?", hint: "" },
            { q: "Do you use GenAI for documentation, medical letters, or coding?", hint: "e.g., ICD/OPS coding, findings texts" },
            { q: "Are there AI projects for care management / population health management?", hint: "" },
          ]
        },
        {
          title: "Compliance & Regulatory",
          questions: [
            { q: "How do you handle the telematics infrastructure (TI) and ePA?", hint: "Switzerland: EPD (Electronic Patient Dossier)" },
            { q: "What DiGA / DTx (Digital Health Applications) requirements exist?", hint: "" },
            { q: "How is data protection ensured in healthcare context (§ 203 StGB, GDPR)?", hint: "Switzerland: DSG, patient confidentiality" },
          ]
        },
      ]
    },
    automotive: {
      label: "Automotive",
      desc: "OEMs, suppliers, mobility, e-mobility, connected car",
      sections: [
        {
          title: "SAP System Landscape Automotive",
          questions: [
            { q: "Do you use SAP S/4HANA with Vehicle Management System (VMS)?", hint: "SAP VMS (IS-A-VMS) is the industry solution for vehicle sales and management" },
            { q: "Is SAP Digital Manufacturing (DM) or SAP Manufacturing Execution (ME) in use?", hint: "" },
            { q: "Do you use SAP Integrated Business Planning (IBP) for supply chain planning?", hint: "Successor to SAP APO" },
          ]
        },
        {
          title: "AI-specific for Automotive",
          questions: [
            { q: "Do you use AI in quality assurance (visual inspection, SPC)?", hint: "" },
            { q: "Is there AI-based predictive maintenance for production equipment?", hint: "" },
            { q: "Do you use AI for supply chain risk management / bottleneck prediction?", hint: "" },
            { q: "Are AI models used for demand forecasting in aftersales?", hint: "" },
            { q: "Are there AI applications in connected car / telematics?", hint: "" },
            { q: "Do you use AI for variant configuration or engineering?", hint: "" },
          ]
        },
        {
          title: "Data & Integration",
          questions: [
            { q: "Are you connected to Catena-X / Manufacturing-X?", hint: "" },
            { q: "How is IoT data (shop floor, machines, vehicles) collected?", hint: "" },
          ]
        },
      ]
    },
    manufacturing: {
      label: "Manufacturing Industry",
      desc: "Mechanical engineering, plant engineering, electronics, manufacturing industry",
      sections: [
        {
          title: "SAP System Landscape Manufacturing",
          questions: [
            { q: "Do you use SAP Digital Manufacturing (DM) or SAP Manufacturing Execution (ME)?", hint: "SAP DM = cloud solution; SAP ME = on-premise MES" },
            { q: "Is SAP PP/DS or SAP Integrated Business Planning (IBP) in use?", hint: "PP/DS = embedded in S/4HANA; IBP = cloud-based planning" },
            { q: "Do you use SAP Plant Maintenance (PM) or S/4HANA Asset Management?", hint: "PM = classic module; EAM = S/4HANA designation" },
          ]
        },
        {
          title: "AI-specific for Manufacturing",
          questions: [
            { q: "Do you use predictive maintenance or condition monitoring?", hint: "e.g., SAP Asset Performance Management (APM), Azure IoT, custom ML models" },
            { q: "Is there AI-based quality inspection (visual inspection, anomaly detection)?", hint: "" },
            { q: "Do you use AI for demand forecasting / supply chain optimization?", hint: "" },
            { q: "Are digital twins or simulation models used?", hint: "" },
            { q: "Is there IoT/sensor data for AI applications?", hint: "OPC UA, MQTT, shop floor data" },
          ]
        },
        {
          title: "Data & Integration",
          questions: [
            { q: "How is machine data currently captured and processed?", hint: "" },
            { q: "Is there integration between MES and SAP ERP?", hint: "" },
          ]
        },
      ]
    },
    retail: {
      label: "Retail / Commerce",
      desc: "Retail, e-commerce, wholesale, fashion",
      sections: [
        {
          title: "SAP System Landscape Retail",
          questions: [
            { q: "Do you use SAP Customer Activity Repository (CAR)?", hint: "Central platform for POS data, omnichannel analytics, demand forecasting" },
            { q: "Is SAP Commerce Cloud or SAP Emarsys Customer Engagement in use?", hint: "Commerce Cloud = e-commerce platform; Emarsys = marketing automation" },
            { q: "Do you use SAP S/4HANA Retail (Merchandise Mgmt, Allocation)?", hint: "Successor to SAP Retail (IS-R)" },
          ]
        },
        {
          title: "AI-specific for Retail",
          questions: [
            { q: "Do you use AI-based personalization in e-commerce?", hint: "Product recommendations, dynamic pricing" },
            { q: "Do you use AI for demand forecasting / inventory optimization?", hint: "" },
            { q: "Is there AI-supported price optimization (dynamic pricing)?", hint: "" },
            { q: "Are chatbots / AI assistants used in customer service?", hint: "" },
            { q: "Do you use sentiment analysis or customer journey analytics?", hint: "" },
          ]
        },
        {
          title: "Data & Omnichannel",
          questions: [
            { q: "How is omnichannel data (POS, online, mobile) consolidated?", hint: "" },
            { q: "Is there a CDP or unified customer profile?", hint: "" },
          ]
        },
      ]
    },
    energy: {
      label: "Energy / Utilities",
      desc: "Energy suppliers, utilities, oil & gas, renewables",
      sections: [
        {
          title: "SAP System Landscape Energy",
          questions: [
            { q: "Do you use SAP IS-U or already SAP S/4HANA Utilities?", hint: "IS-U maintenance end under SAP ERP: end of 2027; successor: S/4HANA Utilities" },
            { q: "Is SAP Asset Performance Management (APM) in use?", hint: "SAP APM = SaaS solution for predictive maintenance and condition monitoring" },
            { q: "Do you use SAP for billing / meter data management?", hint: "" },
          ]
        },
        {
          title: "AI-specific for Energy",
          questions: [
            { q: "Do you use AI for load forecasting?", hint: "" },
            { q: "Is there predictive maintenance for grid infrastructure?", hint: "" },
            { q: "Do you use AI for energy trading or price optimization?", hint: "" },
            { q: "Is smart meter data analyzed with AI?", hint: "" },
            { q: "Is there AI-based grid optimization or demand response?", hint: "" },
          ]
        },
        {
          title: "Data & OT Integration",
          questions: [
            { q: "How is IoT/SCADA data processed and stored?", hint: "" },
            { q: "Is there integration between OT and IT/SAP?", hint: "" },
          ]
        },
      ]
    },
    publicSector: {
      label: "Public Sector / Government",
      desc: "Government agencies, municipalities, education, federal administration",
      sections: [
        {
          title: "SAP System Landscape Public",
          questions: [
            { q: "Do you use SAP IS-PS (Public Sector) or S/4HANA Public Sector Management?", hint: "Budget management (PSM), grants management" },
            { q: "Is SAP PSCD (Public Sector Collections & Disbursements) in use?", hint: "Tax/fee collection, disbursements" },
            { q: "Do you use SAP SuccessFactors or SAP HCM for HR?", hint: "" },
          ]
        },
        {
          title: "AI-specific for Public Sector",
          questions: [
            { q: "Are there AI pilot projects for citizen services (chatbots, applications)?", hint: "" },
            { q: "Do you use AI for document analysis / case processing?", hint: "" },
            { q: "Do you use AI-based fraud detection?", hint: "" },
            { q: "Is there AI-supported resource planning / budget optimization?", hint: "" },
          ]
        },
        {
          title: "Sovereignty & Compliance",
          questions: [
            { q: "What requirements apply regarding digital sovereignty?", hint: "DE: BSI, IT-Grundschutz, Delos Cloud / CH: Swiss Government Cloud" },
            { q: "How is the EU AI Act implemented (high-risk AI)?", hint: "" },
          ]
        },
      ]
    },
    lifeSciences: {
      label: "Life Sciences / Pharma",
      desc: "Pharma, medical technology, biotech, chemicals",
      sections: [
        {
          title: "SAP System Landscape Life Sciences",
          questions: [
            { q: "Do you use SAP S/4HANA with industry-specific life sciences functions?", hint: "e.g., batch traceability, serialization, GMP processes" },
            { q: "Is SAP EHS Management (Environment, Health & Safety) in use?", hint: "Hazardous materials management, occupational safety" },
            { q: "Do you use SAP Advanced Track and Trace for Pharmaceuticals (ATTP)?", hint: "Serialization according to EU FMD / US DSCSA" },
          ]
        },
        {
          title: "AI-specific for Life Sciences",
          questions: [
            { q: "Do you use AI in research & development?", hint: "Drug discovery, molecular design" },
            { q: "Is there AI-based quality control in production?", hint: "PAT, visual inspection" },
            { q: "Do you use AI for clinical trials?", hint: "Patient matching, adverse event detection" },
            { q: "Are AI models used for supply chain / cold chain?", hint: "" },
          ]
        },
        {
          title: "Validation & Compliance",
          questions: [
            { q: "How do you handle GxP validation of AI systems?", hint: "CSV/CSA" },
            { q: "What FDA/EMA/Swissmedic requirements apply?", hint: "" },
          ]
        },
      ]
    },
    lottery: {
      label: "Lottery / Gaming",
      desc: "State lotteries, sports betting, gambling — adesso 20+ years expertise",
      sections: [
        {
          title: "IT Systems Lottery",
          questions: [
            { q: "Which lottery core systems (gaming platform) are in use?", hint: "e.g., adesso solutions, IGT, Scientific Games, custom development" },
            { q: "Do you use SAP as ERP system for the lottery company?", hint: "" },
            { q: "Which online/mobile gaming platforms do you operate?", hint: "" },
          ]
        },
        {
          title: "AI-specific for Lottery",
          questions: [
            { q: "Do you use AI for player protection / responsible gaming?", hint: "e.g., detection of problematic gambling behavior" },
            { q: "Do you use AI-based fraud and manipulation detection?", hint: "" },
            { q: "Is there AI for customer analysis / personalization?", hint: "e.g., player profiles, offer optimization" },
            { q: "Do you use AI for ticket recognition (OCR/Vision)?", hint: "e.g., adesso AI-based ticket recognition" },
            { q: "Are AI chatbots used for customer service?", hint: "" },
          ]
        },
        {
          title: "Security & Regulatory",
          questions: [
            { q: "Are you WLA-SCS certified?", hint: "World Lottery Association Security Control Standard" },
            { q: "What regulatory requirements apply (GlüStV, state law)?", hint: "" },
          ]
        },
      ]
    },
    transport: {
      label: "Transport & Logistics",
      desc: "Public transport, rail, logistics, mobility as a service",
      sections: [
        {
          title: "SAP & Transport Systems",
          questions: [
            { q: "Do you use SAP Transportation Management (SAP TM)?", hint: "Integrated in S/4HANA for transport planning and execution" },
            { q: "Is SAP EAM (Enterprise Asset Management) / PM used for vehicle fleets?", hint: "Maintenance planning, maintenance cycles" },
            { q: "Do you use SAP HCM or SuccessFactors for workforce planning?", hint: "e.g., shift planning, deployment planning" },
          ]
        },
        {
          title: "AI-specific for Transport & Logistics",
          questions: [
            { q: "Do you use AI for schedule optimization / route planning?", hint: "" },
            { q: "Is there predictive maintenance for vehicle fleets?", hint: "" },
            { q: "Do you use AI for passenger forecasts / demand planning?", hint: "" },
            { q: "Are AI chatbots used for customer service?", hint: "e.g., travel information, disruption reports" },
            { q: "Is there AI-based anomaly detection in operations?", hint: "e.g., delay analysis, disruption prediction" },
          ]
        },
        {
          title: "Data & IoT",
          questions: [
            { q: "How is real-time operational data captured (ITCS, telematics)?", hint: "" },
            { q: "Is there a data strategy for mobility data / MaaS?", hint: "" },
          ]
        },
      ]
    },
    media: {
      label: "Media & Entertainment",
      desc: "Publishers, broadcasting, streaming, gaming, digital media",
      sections: [
        {
          title: "SAP & Media Systems",
          questions: [
            { q: "Do you use SAP as ERP system?", hint: "" },
            { q: "Which content management or publishing systems are in use?", hint: "" },
          ]
        },
        {
          title: "AI-specific for Media",
          questions: [
            { q: "Do you use AI for content creation / GenAI?", hint: "e.g., automatic text generation, image generation" },
            { q: "Do you use AI for personalization / recommendation engines?", hint: "" },
            { q: "Is there AI-based advertising optimization (ad tech)?", hint: "Programmatic, targeting" },
            { q: "Are AI tools used for media analysis / monitoring?", hint: "" },
            { q: "Do you use AI for automation of editorial workflows?", hint: "" },
          ]
        },
      ]
    },
    defense: {
      label: "Defense",
      desc: "Armed forces, defense industry, security agencies",
      sections: [
        {
          title: "SAP Defense Systems",
          questions: [
            { q: "Do you use SAP S/4HANA Defense & Security (D&S)?", hint: "Successor to former DFPS solution, since S/4HANA 1909" },
            { q: "Which SAP modules do you use in the defense context?", hint: "e.g., Materials Management (MM), Maintenance (PM/EAM), HR (HCM), Finance (FI/CO)" },
            { q: "Do you use SASPF (the SAP-based ERP implementation of the Bundeswehr)?", hint: "SASPF = Standard Application Software Product Family of the Bundeswehr" },
          ]
        },
        {
          title: "AI-specific for Defense",
          questions: [
            { q: "Do you use AI for predictive maintenance of weapon systems/vehicles?", hint: "e.g., via SAP APM or custom ML models" },
            { q: "Is there AI-based logistics/supply chain optimization in use?", hint: "e.g., spare parts forecasting, inventory optimization" },
            { q: "Do you use AI for situational awareness / intelligence analysis?", hint: "" },
            { q: "Are AI models used for personnel or mission planning?", hint: "" },
          ]
        },
        {
          title: "Security & Sovereignty",
          questions: [
            { q: "What classification levels apply to your IT systems?", hint: "VS-NfD, VS-Confidential, Secret, Top Secret" },
            { q: "What IT sovereignty and location requirements exist?", hint: "e.g., operation exclusively in DE, no public cloud services with US jurisdiction" },
          ]
        },
      ]
    },
    foodBeverage: {
      label: "Food & Beverage",
      desc: "Food and beverage industry, food production",
      sections: [
        {
          title: "AI-specific for Food & Beverage",
          questions: [
            { q: "Do you use AI for demand forecasting / sales planning?", hint: "Particularly relevant due to perishability" },
            { q: "Is there AI-based quality control in production?", hint: "e.g., visual inspection, sensors" },
            { q: "Do you use AI for supply chain optimization (fresh logistics)?", hint: "" },
            { q: "Are AI models used for recipe optimization / product development?", hint: "" },
            { q: "Are there AI applications for traceability / track & trace?", hint: "EU regulation, recall management" },
          ]
        },
      ]
    },
    construction: {
      label: "Construction & Real Estate",
      desc: "Construction companies, real estate, housing industry, PropTech",
      sections: [
        {
          title: "AI-specific for Construction & Real Estate",
          questions: [
            { q: "Do you use BIM (Building Information Modeling) with AI support?", hint: "" },
            { q: "Do you use AI for project planning / cost forecasting?", hint: "" },
            { q: "Is there AI-based energy optimization of buildings?", hint: "Smart building, predictive energy management" },
            { q: "Do you use AI for property valuation / market analysis?", hint: "" },
            { q: "Do you use AI in facility management?", hint: "Predictive maintenance, space utilization" },
          ]
        },
      ]
    },
    tradeFairsSports: {
      label: "Trade Fairs & Sports",
      desc: "Trade fair companies, sports clubs, events",
      sections: [
        {
          title: "AI-specific for Events & Sports",
          questions: [
            { q: "Do you use AI for visitor forecasts / capacity planning?", hint: "" },
            { q: "Do you use AI for personalization in ticketing / CRM?", hint: "" },
            { q: "Is there AI-based matchday optimization or fan engagement?", hint: "" },
            { q: "Are AI models used for revenue management?", hint: "e.g., dynamic pricing for booth space or tickets" },
            { q: "Do you use AI for event data analysis / analytics?", hint: "" },
          ]
        },
      ]
    },
    telecom: {
      label: "Telecom",
      desc: "Telecommunications, network operators, ISPs — primarily Switzerland",
      sections: [
        {
          title: "AI-specific for Telecommunications",
          questions: [
            { q: "Do you use AI for network performance monitoring / optimization?", hint: "" },
            { q: "Is there AI-based predictive maintenance for network infrastructure?", hint: "" },
            { q: "Do you use AI for churn prediction / customer retention?", hint: "" },
            { q: "Are AI chatbots used in customer service?", hint: "" },
            { q: "Is there AI-supported anomaly detection / fraud detection?", hint: "" },
            { q: "Do you use AI for network planning (5G rollout, capacity)?", hint: "" },
          ]
        },
      ]
    },
    professionalServices: {
      label: "Professional Services",
      desc: "Consulting, auditing, legal advisory, IT services — adesso bc focus industry",
      sections: [
        {
          title: "SAP System Landscape Professional Services",
          questions: [
            { q: "Do you use SAP S/4HANA Cloud (Public or Private Edition)?", hint: "Public Edition = SaaS; Private Edition = managed cloud" },
            { q: "Is SAP Professional Services Cloud or SAP PS (Project System) in use?", hint: "Project planning, time recording, billing" },
            { q: "Do you use SAP SuccessFactors for talent management?", hint: "Recruiting, learning, performance, Employee Central" },
          ]
        },
        {
          title: "AI-specific for Professional Services",
          questions: [
            { q: "Do you use AI for resource planning / skill-based staffing?", hint: "" },
            { q: "Do you use AI for project forecasts (budget, schedules, risks)?", hint: "" },
            { q: "Is there AI-based proposal optimization / pricing?", hint: "" },
            { q: "Do you use GenAI for document creation or knowledge management?", hint: "e.g., proposal creation, contract texts, internal knowledge base" },
            { q: "Do you use AI for time tracking or automation of administrative processes?", hint: "" },
          ]
        },
      ]
    },
    chemical: {
      label: "Chemical / Process Industries",
      desc: "Chemicals, process industry, basic materials — adesso bc SAP Diamond Partner",
      sections: [
        {
          title: "SAP System Landscape Chemical",
          questions: [
            { q: "Do you use SAP S/4HANA with process manufacturing (PP-PI)?", hint: "Recipe management, batch management, process orders" },
            { q: "Is SAP EHS Management (Environment, Health & Safety) in use?", hint: "Hazardous materials management, SDS creation, occupational safety" },
            { q: "Do you use SAP Responsible Design and Production?", hint: "Sustainability reporting, circular economy, carbon footprint" },
          ]
        },
        {
          title: "AI-specific for Chemical / Process Industry",
          questions: [
            { q: "Do you use AI for process optimization in production?", hint: "e.g., yield optimization, recipe optimization" },
            { q: "Is there AI-based predictive maintenance for production equipment?", hint: "" },
            { q: "Do you use AI for demand forecasting / S&OP?", hint: "" },
            { q: "Are AI models used for quality assurance / laboratory (LIMS integration)?", hint: "" },
            { q: "Are there AI applications for ESG reporting or emissions management?", hint: "" },
          ]
        },
      ]
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CORE SECTIONS (Standard Questions)
  // ═══════════════════════════════════════════════════════════════
  sections: {
    general: {
      title: "📋 General Information",
      questions: [
        { q: "Customer Name", hint: "" },
        { q: "Contact Person", hint: "" },
        { q: "Email", hint: "" },
        { q: "Consultant (internal)", hint: "" },
      ]
    },
    landscape: {
      title: "💻 SAP System Landscape",
      questions: [
        { q: "Which SAP systems do you currently use?", hint: "e.g., S/4HANA, ECC, BW/4HANA, SuccessFactors, Ariba, CX" },
        { q: "Which SAP release version do you use?", hint: "e.g., S/4HANA 2023 FPS02, ECC 6.0 EHP8" },
        { q: "On-Premise, Private Cloud, or Public Cloud (RISE/GROW)?", hint: "" },
        { q: "Which database do you use?", hint: "e.g., SAP HANA, HANA Cloud, Oracle, SQL Server" },
        { q: "Are you planning a migration to S/4HANA or RISE with SAP?", hint: "" },
        { q: "Are you pursuing a Clean Core strategy?", hint: "Clean Core = minimizing Z/Y custom code in favor of BTP extensions and standard" },
      ]
    },
    licensing: {
      title: "📝 Licensing",
      questions: [
        { q: "Which SAP license models do you have?", hint: "Named User, Digital Access, Engine-based" },
        { q: "Do you have SAP AI-specific licenses?", hint: "SAP Business AI (incl. Joule), SAP AI Core, SAP AI Launchpad" },
        { q: "Do you have access to SAP AI Core / AI Launchpad?", hint: "" },
        { q: "Licenses for SAP Analytics Cloud?", hint: "Planning, BI, or both?" },
      ]
    },
    btp: {
      title: "☁️ SAP BTP",
      questions: [
        { q: "Do you use SAP BTP?", hint: "Yes / No / Planned" },
        { q: "Which BTP services are in use?", hint: "Integration Suite, AI Core, Datasphere, Build Apps" },
        { q: "BTP license model?", hint: "CPEA (Cloud Platform Enterprise Agreement), Subscription, BTPEA" },
        { q: "Do you use SAP Datasphere?", hint: "Successor to SAP Data Warehouse Cloud and SAP Data Intelligence" },
        { q: "Is SAP Business Data Cloud (BDC) in use or planned?", hint: "Managed SaaS for SAP data standardization — basis for SAP Business AI" },
      ]
    },
    cloud: {
      title: "🌐 Cloud & Integration",
      questions: [
        { q: "Which SAP cloud products do you use?", hint: "SuccessFactors, S/4HANA Cloud, Ariba, Concur, SAC" },
        { q: "Which hyperscaler do you use?", hint: "AWS, Azure, GCP" },
        { q: "Cloud strategy?", hint: "Cloud-first, hybrid, multi-cloud?" },
      ]
    },
    aiSap: {
      title: "🤖 AI in SAP Environment",
      questions: [
        { q: "Do you already use AI features within SAP?", hint: "Intelligent RPA, Predictive Analytics, Cash Application" },
        { q: "Is SAP Joule activated or planned?", hint: "" },
        { q: "SAP Signavio with AI features?", hint: "" },
      ]
    },
    aiNonSap: {
      title: "🧠 Non-SAP AI",
      questions: [
        { q: "Which non-SAP AI tools do you use?", hint: "Microsoft Copilot, ChatGPT, Azure OpenAI, AWS Bedrock" },
        { q: "Custom ML models / data science platforms?", hint: "Databricks, Python/R, Snowflake" },
        { q: "Low-code/no-code AI tools?", hint: "Power Platform AI Builder, UiPath" },
      ]
    },
    data: {
      title: "📊 Data Foundation",
      questions: [
        { q: "Quality of your master and transaction data?", hint: "Excellent / Good / Needs improvement / Critical" },
        { q: "Data strategy / data governance in place?", hint: "" },
        { q: "Central data warehouse / data lake?", hint: "" },
      ]
    },
    security: {
      title: "🔐 Compliance & Governance",
      questions: [
        { q: "AI policy in place?", hint: "" },
        { q: "GDPR in the context of AI?", hint: "Switzerland: DSG" },
        { q: "EU AI Act requirements?", hint: "" },
        { q: "Can data be processed in external AI services?", hint: "" },
      ]
    },
    org: {
      title: "👥 Organization & Skills",
      questions: [
        { q: "Dedicated AI/data science team?", hint: "" },
        { q: "Who drives AI strategically?", hint: "CIO, CDO, Innovation Team" },
        { q: "AI competency of your teams?", hint: "Beginner / Intermediate / Expert" },
      ]
    },
    useCases: {
      title: "🎯 Use Cases & Prioritization",
      questions: [
        { q: "Specific AI use cases identified / implemented?", hint: "" },
        { q: "Greatest AI potential in which area?", hint: "" },
        { q: "Budget for AI initiatives?", hint: "< 50k, 50-200k, 200k-1M, > 1M EUR/CHF" },
        { q: "Time horizon?", hint: "Short-term / Medium-term / Long-term" },
      ]
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // EXPORT TRANSLATIONS
  // ═══════════════════════════════════════════════════════════════
  export: {
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
    industrySpecific: "Industry-specific",
    notAnswered: "— not answered —",
    footer: "SAP AI Readiness Check — created with AI Readiness Check Tool",
    confidential: "CONFIDENTIAL",
  },
};