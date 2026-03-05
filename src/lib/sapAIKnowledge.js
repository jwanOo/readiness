/* ═══════════════════════════════════════════════════════════════
   SAP AI KNOWLEDGE BASE
   Verified information about SAP AI products and capabilities
   with official sources for PowerPoint generation
   
   Based on official SAP AI Infrastructure documentation
   ═══════════════════════════════════════════════════════════════ */

/**
 * Last updated: March 2025
 * All information sourced from official SAP documentation
 */
export const KNOWLEDGE_LAST_UPDATED = '2025-03';

/**
 * SAP AI Infrastructure - Accurate Architecture
 * Based on official SAP documentation
 */
export const SAP_AI_INFRASTRUCTURE = {
  de: {
    title: 'SAP AI Infrastruktur',
    description: 'SAP BTP ist die Plattform-Grundlage. AI Foundation ist das strategische Dach, das verschiedene Services und Tools bündelt.',
    layers: [
      {
        name: 'SAP BTP',
        description: 'Business Technology Platform - Die Grundlage für alle SAP AI Services',
        isFoundation: true
      },
      {
        name: 'AI Foundation (Platform Umbrella)',
        description: 'SAP AI Foundation ist ein Konzept, keine einzelne UI. Es ist das vereinheitlichte AI-Portfolio mit Runtime, Tools und vorgefertigten AI-Services.',
        note: 'Strategische Schicht, die verschiedene Services und Tools bündelt für eine einheitliche AI-Story auf BTP',
        components: [
          {
            name: 'Joule Studio (Low-code UI)',
            description: 'Erstellen von AI-gestützten Apps und Agenten ohne umfangreiche Programmierung',
            details: [
              'Joule Agents laufen in SAP-managed Runtime',
              'Beinhaltet SAP-gelieferte und Custom Joule Agents',
              'Ruft LLMs über Generative AI Hub auf',
              'Gen AI Hub behandelt nur den LLM-Aufruf, nicht die vollständige Agent-Runtime'
            ],
            usesGenAIHub: true
          },
          {
            name: 'SAP Document AI',
            description: 'SAP-managed AI Service für Dokumentenverarbeitung',
            details: [
              'BTP Service mit eigener SAP-managed Runtime',
              'Extrahiert und verarbeitet strukturierte & unstrukturierte Daten aus Geschäftsdokumenten',
              'Beispiel: Liest Purchase Order PDF und erstellt Sales Order'
            ],
            example: 'Liest ein Purchase Order PDF-Dokument von einem Kunden und erstellt einen Sales Order'
          },
          {
            name: 'AI Core (Customer Runtime Engine)',
            description: 'Engine/Instanz auf Ihrem BTP - Führt Custom ML und GenAI Workloads in managed Kubernetes Runtime aus',
            isEngine: true,
            subComponents: [
              {
                name: 'ML Workload Execution',
                description: 'Führt Training-Jobs und Batch-Inferenz-Workloads aus'
              },
              {
                name: 'Model Deployment Runtime',
                description: 'Hostet und exponiert Echtzeit-Inferenz-Endpoints'
              },
              {
                name: 'Generative AI Hub (LLM Access Capability)',
                description: 'Bietet sicheren, kontrollierten Zugang zu Foundation Models (GPT, Gemini, Mistral, etc.)'
              }
            ],
            apis: [
              'AI Core APIs (für programmatischen Zugriff)',
              'Backend "Engine" (keine Buttons zum Klicken)'
            ]
          }
        ]
      },
      {
        name: 'AI Launchpad (Operational UI)',
        description: 'Control Plane zur Konfiguration, Überwachung und Betrieb von AI Core',
        note: 'Das Frontend "Cockpit" zur Verwaltung von AI Core (AI Core Administration)',
        capabilities: [
          'UI zur Verwaltung von AI Core (AI Core Administration)',
          'Konfiguration von Generative AI Hub (LLM-Zugang)',
          'Ausführen und Überwachen von ML-Jobs',
          'Deployment und Verwaltung von Inferenz-Endpoints',
          'Infrastruktur verwalten: Git, Secrets, Resource Groups'
        ],
        managedVia: [
          {
            name: 'Workspaces',
            purpose: 'Isoliert Projekte/Teams und verwaltet Multi-Tenant AI-Umgebungen'
          },
          {
            name: 'Generative AI Hub (UI Section)',
            purpose: 'Konfiguriert Model-Zugang, API-Verbindungen und LLM-Nutzungseinstellungen'
          },
          {
            name: 'AI Core Administration',
            purpose: 'Konfiguriert Infrastruktur, Repositories, Secrets und Compute-Isolation'
          },
          {
            name: 'ML Operations',
            purpose: 'Verwaltet den vollständigen ML-Lifecycle (Training, Deployment, Scheduling, Monitoring)'
          }
        ]
      }
    ],
    customAgents: {
      title: 'Custom Agents (Nicht Joule Custom)',
      description: 'Custom AI Core Agents (Container) laufen innerhalb von AI Core',
      details: [
        'Custom AI Core Agents (Container) → laufen innerhalb von AI Core',
        'Erstellt von Ihnen mit Python, etc.',
        'Sie können keinen Python-Agent in Joule Runtime hochladen',
        'Sie müssen Ihren Python-Agent als API-Endpoint exponieren (z.B. von AI Core oder anderswo)',
        'Dann rufen Sie diese API von einem Joule Custom Agent als Tool/Action auf',
        'Joule orchestriert es, aber Ihr Agent läuft extern'
      ]
    }
  },
  en: {
    title: 'SAP AI Infrastructure',
    description: 'SAP BTP is the platform foundation. AI Foundation is the strategic umbrella bundling various services and tools.',
    layers: [
      {
        name: 'SAP BTP',
        description: 'Business Technology Platform - The foundation for all SAP AI services',
        isFoundation: true
      },
      {
        name: 'AI Foundation (Platform Umbrella)',
        description: 'SAP AI Foundation is just a concept, not a single UI. It is SAP\'s unified AI portfolio combining runtime, tools, and prebuilt AI services.',
        note: 'Strategic layer that bundles several distinct services and tools to provide a unified AI story on BTP',
        components: [
          {
            name: 'Joule Studio (Low-code UI)',
            description: 'Build AI-powered apps and agents without heavy coding',
            details: [
              'Joule agents run in SAP-managed runtime including SAP delivered and Custom Joule Agents',
              'They call LLMs via Generative AI Hub',
              'Gen AI Hub only handles the LLM call, not the full agent runtime',
              'It only enables access to enterprise-governed LLMs for prompts, RAG, and AI agents'
            ],
            usesGenAIHub: true
          },
          {
            name: 'SAP Document AI',
            description: 'SAP-managed AI service for document processing',
            details: [
              'BTP service from SAP with its own SAP managed runtime',
              'Extract and process structured & unstructured data from business documents (invoices, POs, etc.)',
              'Example: Reads a Purchase Order PDF document from a Customer and creates a Sales Order'
            ],
            example: 'Reads a Purchase Order PDF document from a Customer and creates a Sales Order'
          },
          {
            name: 'AI Core (Customer Runtime Engine)',
            description: 'Engine/Instance on your BTP - Execute, train, and deploy custom ML and GenAI workloads in a managed Kubernetes runtime',
            isEngine: true,
            subComponents: [
              {
                name: 'ML Workload Execution',
                description: 'Run training jobs and batch inference workloads'
              },
              {
                name: 'Model Deployment Runtime',
                description: 'Host and expose real-time inference endpoints'
              },
              {
                name: 'Generative AI Hub (LLM Access Capability)',
                description: 'Provide secure, governed access to foundation models (GPT, Gemini, Mistral, etc.)'
              }
            ],
            apis: [
              'AI Core APIs (For programmatic access)',
              'It is the backend "engine" (no buttons to click)'
            ]
          }
        ]
      },
      {
        name: 'AI Launchpad (Operational UI)',
        description: 'Control plane to configure, monitor, and operate AI Core',
        note: 'The frontend "cockpit" where you manage AI Core (AI Core Administration)',
        capabilities: [
          'UI to manage AI Core (AI Core Administration)',
          'Configure Generative AI Hub (LLM access)',
          'Run and monitor ML jobs',
          'Deploy and manage inference endpoints',
          'Manage infra: Git, secrets, resource groups'
        ],
        managedVia: [
          {
            name: 'Workspaces',
            purpose: 'Isolate projects/teams and manage multi-tenant AI environments'
          },
          {
            name: 'Generative AI Hub (UI Section)',
            purpose: 'Configure model access, API connections, and LLM usage settings'
          },
          {
            name: 'AI Core Administration',
            purpose: 'Configure infrastructure, repositories, secrets, and compute isolation'
          },
          {
            name: 'ML Operations',
            purpose: 'Manage full ML lifecycle (train, deploy, schedule, monitor)'
          }
        ]
      }
    ],
    customAgents: {
      title: 'Custom Agents (Not Joule Custom)',
      description: 'Custom AI Core agents (containers) run inside AI Core',
      details: [
        'Custom AI Core agents (containers) → run inside AI Core',
        'Created by you using Python, etc.',
        'You cannot upload a Python agent into Joule runtime',
        'You must expose your Python agent as an API endpoint (e.g., from AI Core or elsewhere)',
        'Then call that API from a Joule custom agent as a tool/action',
        'So Joule orchestrates it, but your agent runs externally'
      ]
    }
  }
};

/**
 * SAP AI Products with verified sources
 */
export const SAP_AI_PRODUCTS = {
  jouleStudio: {
    id: 'jouleStudio',
    de: {
      title: 'Joule Studio',
      subtitle: 'Low-Code UI für AI-Agenten',
      description: 'Joule Studio ermöglicht das Erstellen von AI-gestützten Apps und Agenten ohne umfangreiche Programmierung. Joule Agents laufen in SAP-managed Runtime.',
      keyFeatures: [
        'Low-Code Entwicklung von AI-Agenten',
        'SAP-gelieferte und Custom Joule Agents',
        'Nutzt Generative AI Hub für LLM-Aufrufe',
        'SAP-managed Runtime für Agenten',
        'Integration mit SAP-Anwendungen'
      ],
      availability: 'SAP BTP',
      prerequisites: 'SAP BTP, AI Core mit Generative AI Hub'
    },
    en: {
      title: 'Joule Studio',
      subtitle: 'Low-Code UI for AI Agents',
      description: 'Joule Studio enables building AI-powered apps and agents without heavy coding. Joule agents run in SAP-managed runtime.',
      keyFeatures: [
        'Low-code development of AI agents',
        'SAP-delivered and Custom Joule Agents',
        'Uses Generative AI Hub for LLM calls',
        'SAP-managed runtime for agents',
        'Integration with SAP applications'
      ],
      availability: 'SAP BTP',
      prerequisites: 'SAP BTP, AI Core with Generative AI Hub'
    },
    source: {
      name: 'SAP Help Portal - Joule',
      url: 'https://help.sap.com/docs/joule',
      date: '2024'
    }
  },
  documentAI: {
    id: 'documentAI',
    de: {
      title: 'SAP Document AI',
      subtitle: 'SAP-managed AI Service für Dokumentenverarbeitung',
      description: 'SAP Document AI ist ein BTP Service mit eigener SAP-managed Runtime. Er extrahiert und verarbeitet strukturierte & unstrukturierte Daten aus Geschäftsdokumenten.',
      keyFeatures: [
        'Automatische Dokumentenextraktion',
        'Verarbeitung von Rechnungen, Bestellungen, etc.',
        'SAP-managed Runtime',
        'Integration mit SAP-Geschäftsprozessen',
        'Beispiel: Purchase Order → Sales Order'
      ],
      availability: 'SAP BTP Service',
      prerequisites: 'SAP BTP Account'
    },
    en: {
      title: 'SAP Document AI',
      subtitle: 'SAP-managed AI Service for Document Processing',
      description: 'SAP Document AI is a BTP service with its own SAP managed runtime. It extracts and processes structured & unstructured data from business documents.',
      keyFeatures: [
        'Automatic document extraction',
        'Processing of invoices, purchase orders, etc.',
        'SAP-managed runtime',
        'Integration with SAP business processes',
        'Example: Purchase Order → Sales Order'
      ],
      availability: 'SAP BTP Service',
      prerequisites: 'SAP BTP Account'
    },
    source: {
      name: 'SAP Help Portal - Document AI',
      url: 'https://help.sap.com/docs/document-information-extraction',
      date: '2024'
    }
  },
  aiCore: {
    id: 'aiCore',
    de: {
      title: 'SAP AI Core',
      subtitle: 'Customer Runtime Engine auf BTP',
      description: 'SAP AI Core ist die Engine/Instanz auf Ihrem BTP. Sie führt Custom ML und GenAI Workloads in einer managed Kubernetes Runtime aus. Es ist das Backend "Engine" (keine Buttons zum Klicken).',
      keyFeatures: [
        'ML Workload Execution - Training-Jobs und Batch-Inferenz',
        'Model Deployment Runtime - Echtzeit-Inferenz-Endpoints',
        'Generative AI Hub - Zugang zu Foundation Models (GPT, Gemini, Mistral)',
        'AI Core APIs für programmatischen Zugriff',
        'Managed Kubernetes Runtime'
      ],
      availability: 'SAP BTP Service',
      prerequisites: 'SAP BTP Account, CPEA/BTPEA Credits'
    },
    en: {
      title: 'SAP AI Core',
      subtitle: 'Customer Runtime Engine on BTP',
      description: 'SAP AI Core is the Engine/Instance on your BTP. It executes, trains, and deploys custom ML and GenAI workloads in a managed Kubernetes runtime. It is the backend "engine" (no buttons to click).',
      keyFeatures: [
        'ML Workload Execution - Training jobs and batch inference',
        'Model Deployment Runtime - Real-time inference endpoints',
        'Generative AI Hub - Access to foundation models (GPT, Gemini, Mistral)',
        'AI Core APIs for programmatic access',
        'Managed Kubernetes runtime'
      ],
      availability: 'SAP BTP Service',
      prerequisites: 'SAP BTP Account, CPEA/BTPEA Credits'
    },
    source: {
      name: 'SAP Help Portal - AI Core',
      url: 'https://help.sap.com/docs/ai-core',
      date: '2024'
    }
  },
  aiLaunchpad: {
    id: 'aiLaunchpad',
    de: {
      title: 'SAP AI Launchpad',
      subtitle: 'Operational UI für AI Core',
      description: 'AI Launchpad ist die Control Plane zur Konfiguration, Überwachung und Betrieb von AI Core. Es ist das Frontend "Cockpit" zur Verwaltung von AI Core.',
      keyFeatures: [
        'Workspaces - Projekt/Team-Isolation, Multi-Tenant AI-Umgebungen',
        'Generative AI Hub UI - Model-Zugang, API-Verbindungen, LLM-Einstellungen',
        'AI Core Administration - Infrastruktur, Repositories, Secrets',
        'ML Operations - Vollständiger ML-Lifecycle (Train, Deploy, Schedule, Monitor)',
        'Inferenz-Endpoint-Verwaltung'
      ],
      availability: 'SAP BTP Service',
      prerequisites: 'SAP AI Core Subscription'
    },
    en: {
      title: 'SAP AI Launchpad',
      subtitle: 'Operational UI for AI Core',
      description: 'AI Launchpad is the control plane to configure, monitor, and operate AI Core. It is the frontend "cockpit" where you manage AI Core.',
      keyFeatures: [
        'Workspaces - Project/team isolation, multi-tenant AI environments',
        'Generative AI Hub UI - Model access, API connections, LLM settings',
        'AI Core Administration - Infrastructure, repositories, secrets',
        'ML Operations - Full ML lifecycle (train, deploy, schedule, monitor)',
        'Inference endpoint management'
      ],
      availability: 'SAP BTP Service',
      prerequisites: 'SAP AI Core Subscription'
    },
    source: {
      name: 'SAP Help Portal - AI Launchpad',
      url: 'https://help.sap.com/docs/ai-launchpad',
      date: '2024'
    }
  },
  genAIHub: {
    id: 'genAIHub',
    de: {
      title: 'Generative AI Hub',
      subtitle: 'LLM Access Capability in AI Core',
      description: 'Der Generative AI Hub ist Teil von AI Core und bietet sicheren, kontrollierten Zugang zu Foundation Models wie GPT, Gemini, Mistral. Er behandelt nur den LLM-Aufruf, nicht die vollständige Agent-Runtime.',
      keyFeatures: [
        'Zugang zu Foundation Models (GPT, Gemini, Mistral, etc.)',
        'Enterprise-governed LLM-Zugang',
        'Für Prompts, RAG und AI Agents',
        'API-Verbindungen und Nutzungseinstellungen',
        'Sicherheit und Governance'
      ],
      availability: 'Teil von SAP AI Core',
      prerequisites: 'SAP AI Core Subscription'
    },
    en: {
      title: 'Generative AI Hub',
      subtitle: 'LLM Access Capability in AI Core',
      description: 'The Generative AI Hub is part of AI Core and provides secure, governed access to foundation models like GPT, Gemini, Mistral. It only handles the LLM call, not the full agent runtime.',
      keyFeatures: [
        'Access to foundation models (GPT, Gemini, Mistral, etc.)',
        'Enterprise-governed LLM access',
        'For prompts, RAG, and AI agents',
        'API connections and usage settings',
        'Security and governance'
      ],
      availability: 'Part of SAP AI Core',
      prerequisites: 'SAP AI Core Subscription'
    },
    source: {
      name: 'SAP Help Portal - Generative AI Hub',
      url: 'https://help.sap.com/docs/sap-ai-core/sap-ai-core-service-guide/generative-ai-hub',
      date: '2024'
    }
  },
  businessDataCloud: {
    id: 'businessDataCloud',
    de: {
      title: 'SAP Business Data Cloud',
      subtitle: 'Datengrundlage für SAP Business AI',
      description: 'SAP Business Data Cloud ist die managed SaaS-Lösung für die Standardisierung und Bereitstellung von SAP-Daten als Grundlage für KI-Anwendungen.',
      keyFeatures: [
        'Standardisierte SAP-Datenmodelle',
        'Automatische Datenharmonisierung',
        'Semantische Schicht für KI-Training',
        'Integration mit SAP Datasphere',
        'Grundlage für SAP Business AI'
      ],
      availability: 'SAP Cloud Service',
      prerequisites: 'SAP BTP, Datasphere'
    },
    en: {
      title: 'SAP Business Data Cloud',
      subtitle: 'Data Foundation for SAP Business AI',
      description: 'SAP Business Data Cloud is the managed SaaS solution for standardizing and providing SAP data as the foundation for AI applications.',
      keyFeatures: [
        'Standardized SAP data models',
        'Automatic data harmonization',
        'Semantic layer for AI training',
        'Integration with SAP Datasphere',
        'Foundation for SAP Business AI'
      ],
      availability: 'SAP Cloud Service',
      prerequisites: 'SAP BTP, Datasphere'
    },
    source: {
      name: 'SAP',
      url: 'https://www.sap.com/products/technology-platform/business-data-cloud.html',
      date: '2024'
    }
  },
  datasphere: {
    id: 'datasphere',
    de: {
      title: 'SAP Datasphere',
      subtitle: 'Unified Data Platform',
      description: 'SAP Datasphere ist die zentrale Datenplattform für die Vereinheitlichung von SAP- und Non-SAP-Daten mit semantischer Modellierung.',
      keyFeatures: [
        'Data Warehouse und Data Lake in einer Lösung',
        'Semantische Modellierung mit Business Layer',
        'Federation zu verschiedenen Datenquellen',
        'Integration mit SAP Analytics Cloud',
        'Grundlage für KI und Analytics'
      ],
      availability: 'SAP Cloud Service',
      prerequisites: 'SAP BTP Account'
    },
    en: {
      title: 'SAP Datasphere',
      subtitle: 'Unified Data Platform',
      description: 'SAP Datasphere is the central data platform for unifying SAP and non-SAP data with semantic modeling.',
      keyFeatures: [
        'Data warehouse and data lake in one solution',
        'Semantic modeling with business layer',
        'Federation to various data sources',
        'Integration with SAP Analytics Cloud',
        'Foundation for AI and analytics'
      ],
      availability: 'SAP Cloud Service',
      prerequisites: 'SAP BTP Account'
    },
    source: {
      name: 'SAP Help Portal - Datasphere',
      url: 'https://help.sap.com/docs/SAP_DATASPHERE',
      date: '2024'
    }
  }
};

/**
 * SAP AI Use Cases by Industry
 */
export const SAP_AI_USE_CASES = {
  de: {
    finance: [
      'Intelligente Rechnungsverarbeitung (Document AI)',
      'Automatisches Cash Application',
      'Predictive Forecasting',
      'Anomalie-Erkennung in Transaktionen',
      'Automatisierte Periodenabschlüsse'
    ],
    supplyChain: [
      'Demand Forecasting mit ML',
      'Predictive Maintenance',
      'Intelligente Bestandsoptimierung',
      'Supply Chain Risk Management',
      'Automatische Lieferantenauswahl'
    ],
    hr: [
      'Intelligentes Recruiting',
      'Skill-basiertes Staffing',
      'Employee Experience Insights',
      'Predictive Attrition',
      'Automatisierte Onboarding-Prozesse'
    ],
    sales: [
      'Lead Scoring mit ML',
      'Next Best Action',
      'Intelligente Preisoptimierung',
      'Customer Churn Prediction',
      'Automatisierte Angebotserstellung'
    ],
    procurement: [
      'Intelligente Lieferantenbewertung',
      'Automatische Vertragsanalyse',
      'Spend Analytics mit KI',
      'Guided Buying',
      'Risk Assessment'
    ],
    documentProcessing: [
      'Purchase Order → Sales Order Automatisierung',
      'Rechnungsextraktion und -verarbeitung',
      'Vertragsanalyse',
      'Lieferschein-Verarbeitung',
      'Compliance-Dokumentenprüfung'
    ]
  },
  en: {
    finance: [
      'Intelligent Invoice Processing (Document AI)',
      'Automated Cash Application',
      'Predictive Forecasting',
      'Transaction Anomaly Detection',
      'Automated Period-End Closing'
    ],
    supplyChain: [
      'Demand Forecasting with ML',
      'Predictive Maintenance',
      'Intelligent Inventory Optimization',
      'Supply Chain Risk Management',
      'Automated Supplier Selection'
    ],
    hr: [
      'Intelligent Recruiting',
      'Skill-based Staffing',
      'Employee Experience Insights',
      'Predictive Attrition',
      'Automated Onboarding Processes'
    ],
    sales: [
      'Lead Scoring with ML',
      'Next Best Action',
      'Intelligent Price Optimization',
      'Customer Churn Prediction',
      'Automated Quote Generation'
    ],
    procurement: [
      'Intelligent Supplier Evaluation',
      'Automated Contract Analysis',
      'Spend Analytics with AI',
      'Guided Buying',
      'Risk Assessment'
    ],
    documentProcessing: [
      'Purchase Order → Sales Order Automation',
      'Invoice extraction and processing',
      'Contract analysis',
      'Delivery note processing',
      'Compliance document review'
    ]
  }
};

/**
 * SAP AI Roadmap Recommendations based on readiness level
 */
export const SAP_AI_ROADMAP = {
  de: {
    notReady: {
      title: 'Grundlagen schaffen',
      shortTerm: [
        'S/4HANA Migration planen oder starten',
        'Clean-Core-Strategie definieren',
        'Datenqualität analysieren und verbessern',
        'Data Governance Framework aufbauen'
      ],
      mediumTerm: [
        'SAP BTP evaluieren und einführen',
        'Erste KI-Pilotprojekte identifizieren',
        'KI-Kompetenz im Team aufbauen',
        'KI-Richtlinie erstellen'
      ],
      longTerm: [
        'SAP AI Core und AI Launchpad aktivieren',
        'KI-Use-Cases skalieren',
        'Center of Excellence aufbauen'
      ]
    },
    partial: {
      title: 'KI-Adoption beschleunigen',
      shortTerm: [
        'SAP AI Launchpad einrichten',
        'Generative AI Hub konfigurieren',
        'SAP Document AI für Dokumentenverarbeitung evaluieren',
        'Quick-Win Use Cases umsetzen'
      ],
      mediumTerm: [
        'Custom ML-Modelle in AI Core deployen',
        'Joule Studio für Agent-Entwicklung nutzen',
        'RAG-Pipelines mit Generative AI Hub aufbauen',
        'SAP Datasphere einführen'
      ],
      longTerm: [
        'SAP Business Data Cloud einführen',
        'Custom Agents entwickeln und integrieren',
        'KI-gestützte Prozessautomatisierung'
      ]
    },
    ready: {
      title: 'KI-Excellence erreichen',
      shortTerm: [
        'Joule Agents für Geschäftsprozesse entwickeln',
        'Custom AI-Modelle in AI Core deployen',
        'KI-gestützte Entscheidungsunterstützung',
        'Prozessautomatisierung mit GenAI'
      ],
      mediumTerm: [
        'Branchenspezifische KI-Lösungen entwickeln',
        'Custom Agents mit Python in AI Core',
        'Predictive und Prescriptive Analytics',
        'Autonomous Business Processes'
      ],
      longTerm: [
        'KI-Differenzierung im Wettbewerb',
        'Neue Geschäftsmodelle mit KI',
        'Continuous AI Innovation'
      ]
    }
  },
  en: {
    notReady: {
      title: 'Build Foundation',
      shortTerm: [
        'Plan or start S/4HANA migration',
        'Define Clean Core strategy',
        'Analyze and improve data quality',
        'Build Data Governance framework'
      ],
      mediumTerm: [
        'Evaluate and adopt SAP BTP',
        'Identify first AI pilot projects',
        'Build AI competence in team',
        'Create AI policy'
      ],
      longTerm: [
        'Activate SAP AI Core and AI Launchpad',
        'Scale AI use cases',
        'Build Center of Excellence'
      ]
    },
    partial: {
      title: 'Accelerate AI Adoption',
      shortTerm: [
        'Set up SAP AI Launchpad',
        'Configure Generative AI Hub',
        'Evaluate SAP Document AI for document processing',
        'Implement quick-win use cases'
      ],
      mediumTerm: [
        'Deploy custom ML models in AI Core',
        'Use Joule Studio for agent development',
        'Build RAG pipelines with Generative AI Hub',
        'Adopt SAP Datasphere'
      ],
      longTerm: [
        'Adopt SAP Business Data Cloud',
        'Develop and integrate custom agents',
        'AI-powered process automation'
      ]
    },
    ready: {
      title: 'Achieve AI Excellence',
      shortTerm: [
        'Develop Joule agents for business processes',
        'Deploy custom AI models in AI Core',
        'AI-powered decision support',
        'Process automation with GenAI'
      ],
      mediumTerm: [
        'Develop industry-specific AI solutions',
        'Custom agents with Python in AI Core',
        'Predictive and prescriptive analytics',
        'Autonomous business processes'
      ],
      longTerm: [
        'AI differentiation in competition',
        'New business models with AI',
        'Continuous AI innovation'
      ]
    }
  }
};

/**
 * All sources for the Sources slide
 */
export const ALL_SOURCES = [
  {
    name: 'SAP Help Portal - AI Core',
    url: 'https://help.sap.com/docs/ai-core',
    date: '2024'
  },
  {
    name: 'SAP Help Portal - AI Launchpad',
    url: 'https://help.sap.com/docs/ai-launchpad',
    date: '2024'
  },
  {
    name: 'SAP Help Portal - Generative AI Hub',
    url: 'https://help.sap.com/docs/sap-ai-core/sap-ai-core-service-guide/generative-ai-hub',
    date: '2024'
  },
  {
    name: 'SAP Help Portal - Joule',
    url: 'https://help.sap.com/docs/joule',
    date: '2024'
  },
  {
    name: 'SAP Help Portal - Document Information Extraction',
    url: 'https://help.sap.com/docs/document-information-extraction',
    date: '2024'
  },
  {
    name: 'SAP - Business Data Cloud',
    url: 'https://www.sap.com/products/technology-platform/business-data-cloud.html',
    date: '2024'
  },
  {
    name: 'SAP Help Portal - SAP Datasphere',
    url: 'https://help.sap.com/docs/SAP_DATASPHERE',
    date: '2024'
  },
  {
    name: 'SAP - Business Technology Platform',
    url: 'https://www.sap.com/products/technology-platform.html',
    date: '2024'
  }
];

/**
 * Get readiness level key from score
 */
export function getReadinessKey(score) {
  if (score >= 66) return 'ready';
  if (score >= 33) return 'partial';
  return 'notReady';
}

/**
 * Get roadmap recommendations based on score
 */
export function getRoadmapForScore(score, language = 'de') {
  const key = getReadinessKey(score);
  return SAP_AI_ROADMAP[language][key];
}

/**
 * Get product info by ID
 */
export function getProductInfo(productId, language = 'de') {
  const product = SAP_AI_PRODUCTS[productId];
  if (!product) return null;
  return {
    ...product[language],
    source: product.source
  };
}

/**
 * Get infrastructure info
 */
export function getInfrastructureInfo(language = 'de') {
  return SAP_AI_INFRASTRUCTURE[language];
}