import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

interface AppState {
  projects: Project[];
  employees: Employee[];
  documents: DocumentType[];
}

interface AppContextType extends AppState {
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addDocument: (doc: Omit<DocumentType, 'id' | 'createdAt'>) => void;
  updateDocument: (id: string, doc: Partial<DocumentType>) => void;
  deleteDocument: (id: string) => void;

  importData: (type: 'staff' | 'documents', data: any[]) => void;
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
    description: 'Full kitchen renovation and MEP (Mechanical, Electrical & Plumbing) systems upgrade across multiple floors of the Nile Plaza hotel.',
    projectValue: 4500000,
    consultant: 'AECOM Middle East',
    subcontractors: 'ElectroPower Egypt, CoolTech MEP',
    completionPercent: 100,
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
    description: 'Infrastructure development and landscape construction across the Mivida residential compound including roads, utilities, and green areas.',
    projectValue: 8200000,
    consultant: 'WSP Global',
    subcontractors: 'GreenLand Landscaping, StructurePro Egypt',
    completionPercent: 100,
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
    description: 'Luxury villa renovations including premium interior fit-out, complete MEP upgrades, and bespoke landscaping across 12 villas.',
    projectValue: 3100000,
    consultant: 'DCI Engineers',
    subcontractors: 'LuxFinish Interiors, ModernMEP',
    completionPercent: 100,
    createdAt: '2020-05-01T00:00:00.000Z'
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
    description: 'Construction works for residential villas and hospitality units at the Marassi beachfront development on Egypt\'s North Coast.',
    projectValue: 12500000,
    consultant: 'Dar Al Handasah (Shair and Partners)',
    subcontractors: 'NorthBuild Co., CoastalMEP, SunSteel Structures',
    completionPercent: 100,
    createdAt: '2021-02-01T00:00:00.000Z'
  }
];

const STORAGE_KEY = 'omega-tc-v2';

const defaultState: AppState = {
  projects: SEED_PROJECTS,
  employees: [],
  documents: []
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fall through to default
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const generateId = () => Math.random().toString(36).substr(2, 9);
  const now = () => new Date().toISOString();

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      projects: [{ ...project, id: generateId(), createdAt: now() }, ...prev.projects]
    }));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const deleteProject = (id: string) => {
    setState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  const addEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      employees: [{ ...employee, id: generateId(), createdAt: now() }, ...prev.employees]
    }));
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setState(prev => ({
      ...prev,
      employees: prev.employees.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const deleteEmployee = (id: string) => {
    setState(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== id) }));
  };

  const addDocument = (doc: Omit<DocumentType, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      documents: [{ ...doc, id: generateId(), createdAt: now() }, ...prev.documents]
    }));
  };

  const updateDocument = (id: string, updates: Partial<DocumentType>) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  const deleteDocument = (id: string) => {
    setState(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
  };

  const importData = (type: 'staff' | 'documents', data: any[]) => {
    if (type === 'staff') {
      const newStaff = data.map(item => ({
        passportExpiry: '',
        insuranceStatus: 'Not Set' as const,
        basicSalary: 0,
        siteAllowance: 0,
        ...item,
        id: generateId(),
        createdAt: now()
      })) as Employee[];
      setState(prev => ({ ...prev, employees: [...newStaff, ...prev.employees] }));
    } else if (type === 'documents') {
      const newDocs = data.map(item => ({
        departmentOwner: '',
        lastRenewed: '',
        notes: '',
        ...item,
        id: generateId(),
        createdAt: now()
      })) as DocumentType[];
      setState(prev => ({ ...prev, documents: [...newDocs, ...prev.documents] }));
    }
  };

  return (
    <AppContext.Provider value={{
      ...state,
      addProject, updateProject, deleteProject,
      addEmployee, updateEmployee, deleteEmployee,
      addDocument, updateDocument, deleteDocument,
      importData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
