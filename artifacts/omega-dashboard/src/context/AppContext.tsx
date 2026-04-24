import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Milestone {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  location: string;
  description: string;
  projectValue: number;
  consultant: string;
  subcontractors: string;
  completionPercent: number;
  technicalSpecs: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  insurancePolicyNumber: string;
  pmNotes: string;
  mepDetails: string;
  civilWorks: string;
  finishingStatus: string;
  milestones: Milestone[];
  assignedStaffIds: string[];
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  passportExpiry: string;
  insuranceStatus: 'Valid' | 'Expired' | 'Not Set';
  basicSalary: number;
  siteAllowance: number;
  currentSite: string;
  createdAt: string;
}

export interface DocumentType {
  id: string;
  name: string;
  type: 'Contract' | 'Permit' | 'License' | 'Other';
  expiryDate: string;
  issuedDate: string;
  projectId?: string;
  notes: string;
  departmentOwner: string;
  lastRenewed: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeName: string;
  role: string;
  department: string;
  siteName: string;
  month: string;
  basicSalary: number;
  siteAllowance: number;
  overtimePay: number;
  deductions: number;
  netSalary: number;
  status: 'Paid' | 'Pending' | 'On Hold';
  notes: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  carName: string;
  plateNumber: string;
  driver: string;
  fuelCardBalance: number;
  lastService: string;
  maintenanceCost: number;
  status: 'Active' | 'In Service' | 'Out of Service';
  notes: string;
  createdAt: string;
}

interface AppState {
  projects: Project[];
  employees: Employee[];
  documents: DocumentType[];
  payrollRecords: PayrollRecord[];
  vehicles: Vehicle[];
  totalLiquidity: number;
}

interface AppContextType extends AppState {
  siteFilter: string;
  setSiteFilter: (f: string) => void;

  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addEmployee: (e: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, e: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addDocument: (d: Omit<DocumentType, 'id' | 'createdAt'>) => void;
  updateDocument: (id: string, d: Partial<DocumentType>) => void;
  deleteDocument: (id: string) => void;

  addPayrollRecord: (r: Omit<PayrollRecord, 'id' | 'createdAt'>) => void;
  updatePayrollRecord: (id: string, r: Partial<PayrollRecord>) => void;
  deletePayrollRecord: (id: string) => void;

  addVehicle: (v: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  updateVehicle: (id: string, v: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  setTotalLiquidity: (amount: number) => void;

  importData: (type: 'staff' | 'documents' | 'payroll', data: any[]) => void;
}

const SEED_PROJECTS: Project[] = [
  {
    id: 'seed-fs-nile',
    name: 'Four Seasons Nile Plaza',
    client: 'Four Seasons Hotels & Resorts',
    status: 'Completed',
    startDate: '2018-03-01',
    endDate: '2019-06-30',
    budget: 4500000,
    spent: 4320000,
    location: 'Garden City, Cairo',
    description: 'Full commercial kitchen renovation and MEP systems upgrade across floors B1 and GF of the Nile Plaza hotel. Scope included stainless steel AISI 304 partitions, dedicated meat preparation area, and complete replacement of aging building services.',
    projectValue: 4500000,
    consultant: 'AECOM Middle East',
    subcontractors: 'ElectroPower Egypt, CoolTech MEP, SteelFab Cairo',
    completionPercent: 100,
    riskLevel: 'Medium',
    insurancePolicyNumber: 'OTC-POL-2018-001',
    technicalSpecs: 'Full commercial kitchen renovation across floors B1 and GF.\n\n• Stainless steel AISI 304 wall partitions and ceiling cladding\n• Dedicated NSF-compliant meat preparation area with COSHH-safe tiled drainage\n• MEP systems upgrade: 3-phase 400A electrical panels, chilled water pipework DN150\n• Type-1 kitchen hood exhaust system with Ansul fire suppression\n• Grease interceptors and commercial waste drainage per local authority requirements\n• All equipment supplied by Four Seasons approved vendors',
    pmNotes: 'Project delivered 6 weeks ahead of schedule. Client requested scope extension in April 2018 for additional cold-room installation — handled via variation order VO-001. Final commissioning included 72-hour witnessed load test for all MEP systems. No LTIs recorded.',
    mepDetails: 'Electrical: New 400A 3-phase distribution board, full LED panel retrofit, emergency lighting per NFPA 101 throughout B1 & GF.\n\nPlumbing: Full copper pipework replacement (BS EN 1254), thermostatic mixing valves, commercial hot water cylinders (300L×2), dedicated grease interceptors (3000L capacity).\n\nHVAC: Kitchen hood extraction at 8,000 CFM with compensating makeup air units, split AC system 5TR for dry storage, walk-in cooler refrigeration (-2°C) and freezer (-18°C).',
    civilWorks: 'Demolition of existing kitchen fit-out across floors B1 and GF.\nStructural slab core-drilling (engineer-supervised) for new drainage runs.\nBlock wall construction for meat prep isolation room (200mm dense block).\nAnti-slip quarry tile flooring throughout (slip resistance R11).\nCementitious waterproofing membrane beneath all tile areas.\nFire-rated boarding (60-min) to kitchen extraction ductwork.',
    finishingStatus: 'All works completed and handed over June 2019. Four Seasons QA sign-off obtained June 28, 2019. Defects liability period of 12 months cleared in full — December 2019. As-built documentation submitted to client.',
    milestones: [
      { id: 'fs-m1', title: 'Project Kickoff & Mobilization', date: '2018-03-01', completed: true },
      { id: 'fs-m2', title: 'Site Preparation & Demolition', date: '2018-04-15', completed: true },
      { id: 'fs-m3', title: 'MEP Rough-in & Structural Works', date: '2018-07-01', completed: true },
      { id: 'fs-m4', title: 'Stainless Steel Partitions & Cladding', date: '2018-10-01', completed: true },
      { id: 'fs-m5', title: 'Kitchen Equipment Installation', date: '2019-02-01', completed: true },
      { id: 'fs-m6', title: 'Commissioning, Testing & Handover', date: '2019-06-30', completed: true },
    ],
    assignedStaffIds: [],
    createdAt: '2018-03-01T00:00:00.000Z'
  },
  {
    id: 'seed-mivida',
    name: 'Mivida – Emaar',
    client: 'Emaar Properties',
    status: 'Completed',
    startDate: '2019-01-15',
    endDate: '2021-08-31',
    budget: 8200000,
    spent: 7950000,
    location: '5th Settlement, New Cairo',
    description: 'Infrastructure development and high-end landscape construction across 45 hectares of the Mivida residential compound. Works included primary road network, underground utilities coordination, boulevard hardscape, ornamental planting, and automated irrigation systems.',
    projectValue: 8200000,
    consultant: 'WSP Global',
    subcontractors: 'GreenLand Landscaping, StructurePro Egypt, NilePipe Utilities',
    completionPercent: 100,
    riskLevel: 'Medium',
    insurancePolicyNumber: 'OTC-POL-2019-002',
    technicalSpecs: 'Infrastructure and landscape works across 45 hectares of Mivida residential compound.\n\n• Primary road network: asphalt, 7m carriageway, 120,000 m³ cut & fill earthworks\n• Underground utilities: 11kV HV cable (2.8km), fiber optic ducting, potable water DN200\n• Irrigation mains DN100, storm drainage 600mm HDPE\n• Landscape: ornamental planting (40+ species), automated drip irrigation with SCADA\n• Feature water bodies, fountain features with LED illumination\n• Boulevard hardscape: granite sett paving, feature pergolas',
    pmNotes: 'Phased delivery approach agreed with Emaar Misr at outset. Phase 1 (primary roads and utilities) completed ahead of schedule. Landscape works delayed by 6 weeks due to plant import restrictions — mitigated by sourcing locally. WSP issued 3 RFIs resolved without variation. All as-built drawings in BIM format submitted.',
    mepDetails: 'HV Cable: 11kV XLPE armoured cable installation (2.8km total run), 4 MV/LV distribution substations (500 kVA each).\n\nStreet Lighting: LED luminaires (4,000K, IP66), PV-assisted controllers on spine boulevard, 240 poles total.\n\nTelecom: HDPE duct network for VDSL/fiber, pre-installed for compound ISP handover.\n\nIrrigation: Pump stations (×3) with Delta SCADA control, weather-compensation sensors, fertigation capability for planting beds.',
    civilWorks: 'Earthworks: 120,000 m³ balanced cut & fill per geotechnical report.\nSub-base G1 crushed stone, 300mm, compacted to 98% MDD.\nAsphalt base course 80mm + wearing course 50mm (Superpave design).\nConcrete kerbing, precast block paving in pedestrian zones.\nRetaining walls (block & mortar) up to 3m height with drainage aggregate backfill.\nBox culverts for wadi crossings (2 locations).',
    finishingStatus: 'Infrastructure formally accepted by Emaar Misr, August 31, 2021. Landscape final inspection passed with minor punch items cleared within 14 days. Full as-built BIM model (Revit MEP + Civil 3D) submitted. Maintenance manual and O&M documentation delivered.',
    milestones: [
      { id: 'mv-m1', title: 'Survey, Design Approval & Mobilization', date: '2019-01-15', completed: true },
      { id: 'mv-m2', title: 'Site Clearance & Bulk Earthworks', date: '2019-05-01', completed: true },
      { id: 'mv-m3', title: 'Underground Utilities Installation', date: '2019-11-01', completed: true },
      { id: 'mv-m4', title: 'Road Base, Subgrade & Paving', date: '2020-06-01', completed: true },
      { id: 'mv-m5', title: 'Landscape Infrastructure & Planting', date: '2021-01-15', completed: true },
      { id: 'mv-m6', title: 'Final Finishing, Punch List & Handover', date: '2021-08-31', completed: true },
    ],
    assignedStaffIds: [],
    createdAt: '2019-01-15T00:00:00.000Z'
  },
  {
    id: 'seed-katameya',
    name: 'Katameya Heights',
    client: 'Palm Hills Developments',
    status: 'Completed',
    startDate: '2020-05-01',
    endDate: '2022-04-30',
    budget: 3100000,
    spent: 3050000,
    location: 'New Cairo',
    description: 'Complete renovation of 2 luxury villas (Villa 12 & Villa 17) at Katameya Heights. Each villa 650m² over 3 floors. Scope included structural repairs, full MEP replacement, KNX smart home integration, premium Italian marble finishes, custom hardwood millwork, and pool refurbishment.',
    projectValue: 3100000,
    consultant: 'DCI Engineers',
    subcontractors: 'LuxFinish Interiors, ModernMEP, KNX Smart Systems, Marble Palace',
    completionPercent: 100,
    riskLevel: 'Low',
    insurancePolicyNumber: 'OTC-POL-2020-003',
    technicalSpecs: 'Complete renovation of 2 luxury villas — Villa 12 & Villa 17 — each 650m² GBA over 3 floors.\n\n• Structural crack repair (epoxy injection, DCI Engineers-supervised)\n• New waterproofing on flat roofs and terraces (Sika Sarnafil membrane)\n• Full MEP replacement: PEX plumbing, KNX smart electrical, Daikin VRV IV HVAC\n• Interior: Italian Calacatta marble flooring, custom hardwood (European oak) millwork\n• Smart home: KNX bus system with Busch-Jaeger panels (lighting, climate, blinds, security)\n• Pool refurbishment: mosaic tile lining, Pentair filtration upgrade, LED underwater lighting',
    pmNotes: 'Two villas delivered sequentially per client request. Villa 12 handed over December 2021, Villa 17 April 2022. Client requested upgrade to Bulthaup kitchen systems mid-project (VO-001, €42k addition). KNX commissioning required 3-week specialist subcontractor presence. Zero defects raised at final inspection for Villa 12; 7 minor items for Villa 17.',
    mepDetails: 'Electrical: KNX bus system (Busch-Jaeger IQ panels), LED recessed lighting with dimming, 32kW SunPower solar PV per villa.\nPlumbing: Rehau PEX-A pipework, Grohe thermostatic shower systems, concealed Geberit cisterns, underfloor heating (ground floor).\nHVAC: Daikin VRV IV outdoor units, concealed cassette indoor units, Zehnder HRV fresh-air system.',
    civilWorks: 'Structural assessment report by DCI Engineers — 14 wall/column crack repairs via epoxy injection.\nNew Sika Sarnafil waterproofing membrane: flat roofs, terraces, bathroom wet areas.\nPool refurbishment: existing gunite shell retained, new mosaic tile (Bisazza), Pentair filtration, LED underwater lighting.\nExternal rendered masonry touch-up, new aluminium double-glazed windows.',
    finishingStatus: 'Villa 12: Handed over Q4 2021. Owner snag list of 0 items. Villa 17: Handed over Q1 2022, 7 minor items cleared within 5 days. 12-month warranty period completed for both villas.',
    milestones: [
      { id: 'kt-m1', title: 'Design, Structural Assessment & Approvals', date: '2020-05-01', completed: true },
      { id: 'kt-m2', title: 'Demolition, Structural Repairs & Waterproofing', date: '2020-08-01', completed: true },
      { id: 'kt-m3', title: 'Full MEP Rough-in (Both Villas)', date: '2021-03-01', completed: true },
      { id: 'kt-m4', title: 'Interior Fit-Out — Villa 12 Complete', date: '2021-09-01', completed: true },
      { id: 'kt-m5', title: 'Interior Fit-Out — Villa 17 Complete', date: '2022-01-15', completed: true },
      { id: 'kt-m6', title: 'Pool, Landscaping & Final Handover', date: '2022-04-30', completed: true },
    ],
    assignedStaffIds: [],
    createdAt: '2020-05-01T00:00:00.000Z'
  },
  {
    id: 'seed-sodic',
    name: 'SODIC Allegria',
    client: 'SODIC',
    status: 'Completed',
    startDate: '2022-06-01',
    endDate: '2024-07-31',
    budget: 5800000,
    spent: 5650000,
    location: '6th of October City',
    description: 'MEP installations and high-end interior finishing works for the Allegria compound amenities including full clubhouse fit-out (1,200m²), sports facility upgrades, and common-area refurbishment across 8 residential clusters. BMS integration delivered under SODIC smart community initiative.',
    projectValue: 5800000,
    consultant: 'Ramboll Group',
    subcontractors: 'Delta Controls Egypt, KnaufBuild, ACS Engineering, LuxStone Interiors',
    completionPercent: 100,
    riskLevel: 'Medium',
    insurancePolicyNumber: 'OTC-POL-2022-004',
    technicalSpecs: 'MEP installation and interior finishing for Allegria compound amenities.\n\n• Clubhouse fit-out (1,200m²): Knauf drywall partitions, Armstrong suspended ceilings\n• Sports facilities: resurfaced tennis/padel courts, gym fit-out with rubber flooring\n• EV charging stations: 24 points (Type 2, 22kW AC)\n• BMS integration: Delta Controls, covering HVAC, lighting, access control, CCTV\n• Pool area: non-slip Porcelain R12 tiles, stainless steel handrails',
    pmNotes: 'Project phased across 3 clusters per quarter to minimise resident disruption. SODIC community relations team embedded with our PM. 2 scope additions approved: EV chargers (VO-001, $320k) and clubhouse AV system (VO-002, $85k). Final SODIC QA inspection passed first attempt.',
    mepDetails: 'Electrical: LV distribution upgrade, Schneider Electric DB boards throughout. LED lighting to IES RP-28. EV charging (24×22kW AC, ABB Terra units). Emergency lighting and addressable fire alarm per NFPA 72.\nPlumbing: Full replacement of communal hot water circuits (central heat pump system). New irrigation mains DN80.\nHVAC: Daikin VRF systems for clubhouse (60HP), MVHR units for basement car park.',
    civilWorks: 'Clubhouse: Internal partition system (Knauf CW/UW 100mm drywall). Suspended ceilings: Armstrong Ultima Tegular.\nExternal hardscape: Granite sett paving, timber composite decking.\nSports courts: Macadam resurfacing with acrylic colour coat, court lighting upgrade to 500 lux LED.\nGeneral: Full redecoration of 8 cluster lobbies.',
    finishingStatus: 'Clubhouse interiors and MEP completed July 2024. BMS commissioning and SCADA handover to SODIC FM team complete. SODIC QA approval received July 29, 2024. Currently in 12-month defects liability period (ends July 2025).',
    milestones: [
      { id: 'sd-m1', title: 'Project Mobilization & Design Finalization', date: '2022-06-01', completed: true },
      { id: 'sd-m2', title: 'MEP Design Approval & Procurement', date: '2022-10-01', completed: true },
      { id: 'sd-m3', title: 'Electrical & Plumbing Rough-in Works', date: '2023-03-01', completed: true },
      { id: 'sd-m4', title: 'HVAC & BMS Installation', date: '2023-09-01', completed: true },
      { id: 'sd-m5', title: 'Interior Finishing & EV Charger Installation', date: '2024-02-01', completed: true },
      { id: 'sd-m6', title: 'BMS Commissioning, Testing & Handover', date: '2024-07-31', completed: true },
    ],
    assignedStaffIds: [],
    createdAt: '2022-06-01T00:00:00.000Z'
  },
  {
    id: 'seed-marassi',
    name: 'Marassi – North Coast',
    client: 'Emaar Misr',
    status: 'Completed',
    startDate: '2021-02-01',
    endDate: '2023-10-31',
    budget: 12500000,
    spent: 12100000,
    location: 'Sidi Abdel Rahman, North Coast',
    description: 'Construction of 18 residential beach villas and 2 F&B hospitality pavilions at Marassi beachfront development. Works included concrete frame construction, full MEP installation, private pools, external hardscape, and beach access infrastructure across two phases.',
    projectValue: 12500000,
    consultant: 'Dar Al Handasah (Shair and Partners)',
    subcontractors: 'NorthBuild Co., CoastalMEP, SunSteel Structures, PoolPro Egypt',
    completionPercent: 100,
    riskLevel: 'High',
    insurancePolicyNumber: 'OTC-POL-2021-005',
    technicalSpecs: 'Construction of 18 beach villas (280–450m² each) and 2 F&B hospitality pavilions.\n\n• Raft foundation design for sandy coastal soil conditions\n• Reinforced concrete frame C30/35 (coastal exposure class XS3)\n• External rendered masonry with 80mm EPS thermal insulation\n• Carrier Aqualzone central HVAC plant serving 8 villa clusters\n• Full MEP installation per NFPA 101\n• Private pool per villa: gunite shell, Bisazza mosaic finish, heat pump heating',
    pmNotes: 'Largest project delivered to date. Complex phased programme: Phase 1 (12 villas) and Phase 2 (6 villas + 2 pavilions). Coastal location required enhanced corrosion protection throughout — stainless steel 316L fixings. Red Sea storm event in September 2022 caused 3-week programme delay — mitigated through weekend working.',
    mepDetails: 'Electrical: Schneider Electric MV/LV distribution network, solar PV ready DC infrastructure, addressable fire detection per NFPA 72.\nPlumbing: PPR hot/cold systems with solar thermal DHW collectors (Apricus, 30-tube per villa), marine-grade fixtures.\nHVAC: Carrier Aqualzone central plant (2×300TR), chilled water distribution, 4-pipe FCUs per room.',
    civilWorks: 'Raft foundations: 600mm thick reinforced concrete on 150mm blinding.\nRC frame: C30/35 (XS3 exposure), 50mm minimum cover, epoxy-coated rebar in splash zone.\nExternal walls: 200mm dense block, 80mm EPS, 10mm GFRC rendered coat.\nPool construction: Gunite shell (300mm), Bisazza glass mosaic finish, Pentair filtration.',
    finishingStatus: 'Phase 1 (12 villas): Formally handed over April 15, 2023. Phase 2 (6 villas + 2 pavilions): Handed over October 31, 2023 — zero outstanding items. Full as-built documentation submitted to Emaar FM team.',
    milestones: [
      { id: 'mr-m1', title: 'Site Mobilization & Foundation Works', date: '2021-02-01', completed: true },
      { id: 'mr-m2', title: 'Concrete Frame — Phase 1 Complete', date: '2021-09-01', completed: true },
      { id: 'mr-m3', title: 'MEP Rough-in & Building Enclosure', date: '2022-04-01', completed: true },
      { id: 'mr-m4', title: 'Interior Finishing — Phase 1 Villas', date: '2022-11-01', completed: true },
      { id: 'mr-m5', title: 'Phase 1 Handover (12 Villas)', date: '2023-04-15', completed: true },
      { id: 'mr-m6', title: 'Phase 2 Complete & Final Handover', date: '2023-10-31', completed: true },
    ],
    assignedStaffIds: [],
    createdAt: '2021-02-01T00:00:00.000Z'
  }
];

const STORAGE_KEY = 'omega-tc-v3';

const defaultState: AppState = {
  projects: SEED_PROJECTS,
  employees: [],
  documents: [],
  payrollRecords: [],
  vehicles: [],
  totalLiquidity: 0
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initialState = saved ? JSON.parse(saved) : defaultState;
    return {
      ...defaultState,
      ...initialState,
      payrollRecords: initialState.payrollRecords ?? [],
      vehicles: initialState.vehicles ?? [],
      totalLiquidity: initialState.totalLiquidity ?? 0
    };
  });

  const [siteFilter, setSiteFilter] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const generateId = () => Math.random().toString(36).substr(2, 9);
  const now = () => new Date().toISOString();

  const addProject = (p: Omit<Project, 'id' | 'createdAt'>) =>
    setState(prev => ({ ...prev, projects: [{ ...p, id: generateId(), createdAt: now() }, ...prev.projects] }));

  const updateProject = (id: string, updates: Partial<Project>) =>
    setState(prev => ({ ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p) }));

  const deleteProject = (id: string) =>
    setState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));

  const addEmployee = (e: Omit<Employee, 'id' | 'createdAt'>) =>
    setState(prev => ({ ...prev, employees: [{ ...e, id: generateId(), createdAt: now() }, ...prev.employees] }));

  const updateEmployee = (id: string, updates: Partial<Employee>) =>
    setState(prev => ({ ...prev, employees: prev.employees.map(e => e.id === id ? { ...e, ...updates } : e) }));

  const deleteEmployee = (id: string) =>
    setState(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== id) }));

  const addDocument = (d: Omit<DocumentType, 'id' | 'createdAt'>) =>
    setState(prev => ({ ...prev, documents: [{ ...d, id: generateId(), createdAt: now() }, ...prev.documents] }));

  const updateDocument = (id: string, updates: Partial<DocumentType>) =>
    setState(prev => ({ ...prev, documents: prev.documents.map(d => d.id === id ? { ...d, ...updates } : d) }));

  const deleteDocument = (id: string) =>
    setState(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));

  const addPayrollRecord = (r: Omit<PayrollRecord, 'id' | 'createdAt'>) =>
    setState(prev => ({ ...prev, payrollRecords: [{ ...r, id: generateId(), createdAt: now() }, ...prev.payrollRecords] }));

  const updatePayrollRecord = (id: string, updates: Partial<PayrollRecord>) =>
    setState(prev => ({ ...prev, payrollRecords: prev.payrollRecords.map(r => r.id === id ? { ...r, ...updates } : r) }));

  const deletePayrollRecord = (id: string) =>
    setState(prev => ({ ...prev, payrollRecords: prev.payrollRecords.filter(r => r.id !== id) }));

  const addVehicle = (v: Omit<Vehicle, 'id' | 'createdAt'>) =>
    setState(prev => ({ ...prev, vehicles: [{ ...v, id: generateId(), createdAt: now() }, ...prev.vehicles] }));

  const updateVehicle = (id: string, updates: Partial<Vehicle>) =>
    setState(prev => ({ ...prev, vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...updates } : v) }));

  const deleteVehicle = (id: string) =>
    setState(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== id) }));

  const setTotalLiquidity = (amount: number) =>
    setState(prev => ({ ...prev, totalLiquidity: amount }));

  const importData = (type: 'staff' | 'documents' | 'payroll', data: any[]) => {
    if (type === 'staff') {
      const items = data.map(item => ({
        passportExpiry: '', insuranceStatus: 'Not Set' as const,
        basicSalary: 0, siteAllowance: 0, currentSite: '',
        ...item, id: generateId(), createdAt: now()
      })) as Employee[];
      setState(prev => ({ ...prev, employees: [...items, ...prev.employees] }));
    } else if (type === 'documents') {
      const items = data.map(item => ({
        departmentOwner: '', lastRenewed: '', notes: '',
        ...item, id: generateId(), createdAt: now()
      })) as DocumentType[];
      setState(prev => ({ ...prev, documents: [...items, ...prev.documents] }));
    } else if (type === 'payroll') {
      const pick = (item: any, ...keys: string[]) => {
        for (const k of keys) {
          const v = item[k] ?? item[k.toLowerCase()] ?? item[k.toUpperCase()];
          if (v !== undefined && v !== '') return v;
        }
        return undefined;
      };
      const items = data.map(item => {
        const basic = Number(
          pick(item,
            'basicSalary','basic_salary','basic','الراتب الأساسي','الراتب','مرتب أساسي',
            'الأجر الأساسي','أجر أساسي','راتب','Salary','salary'
          ) ?? 0
        );
        const allowance = Number(
          pick(item,
            'siteAllowance','site_allowance','allowance','بدل الموقع','بدل موقع','بدل',
            'Site Allowance','site allowance'
          ) ?? 0
        );
        const overtime = Number(
          pick(item,
            'overtimePay','overtime','overtime_pay','إضافي','عمل إضافي','أوفر تايم',
            'ساعات إضافية','Overtime','OT'
          ) ?? 0
        );
        const deductions = Number(
          pick(item,
            'deductions','deduction','خصومات','خصم','الخصومات','الخصم',
            'Deductions','deduct'
          ) ?? 0
        );
        const net = basic + allowance + overtime - deductions;
        return {
          employeeName: String(
            pick(item,
              'employeeName','employee_name','name','الاسم','اسم الموظف','الموظف',
              'Employee Name','Employee','EmployeeName'
            ) ?? ''
          ),
          role: String(pick(item,'role','الوظيفة','المسمى الوظيفي','المسمى','وظيفة','Role','title') ?? ''),
          department: String(pick(item,'department','القسم','الإدارة','قسم','Department','dept') ?? ''),
          siteName: String(pick(item,'siteName','site_name','site','الموقع','المشروع','موقع','Site','Project') ?? ''),
          month: String(pick(item,'month','الشهر','تاريخ','شهر','Month','period') ?? ''),
          basicSalary: basic,
          siteAllowance: allowance,
          overtimePay: overtime,
          deductions,
          netSalary: Math.max(0, net),
          status: (pick(item,'status','الحالة','حالة الدفع','Status') as any) ?? 'Pending',
          notes: String(pick(item,'notes','ملاحظات','Notes') ?? ''),
          id: generateId(),
          createdAt: now()
        } as PayrollRecord;
      });
      setState(prev => ({ ...prev, payrollRecords: [...items, ...prev.payrollRecords] }));
    }
  };

  return (
    <AppContext.Provider value={{
      ...state,
      siteFilter, setSiteFilter,
      addProject, updateProject, deleteProject,
      addEmployee, updateEmployee, deleteEmployee,
      addDocument, updateDocument, deleteDocument,
      addPayrollRecord, updatePayrollRecord, deletePayrollRecord,
      addVehicle, updateVehicle, deleteVehicle,
      setTotalLiquidity,
      importData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
