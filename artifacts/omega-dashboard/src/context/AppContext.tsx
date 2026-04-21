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

const defaultState: AppState = {
  projects: [],
  employees: [],
  documents: []
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('omega-tech-state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local state', e);
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('omega-tech-state', JSON.stringify(state));
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
        ...item,
        id: generateId(),
        createdAt: now()
      })) as Employee[];
      setState(prev => ({ ...prev, employees: [...newStaff, ...prev.employees] }));
    } else if (type === 'documents') {
      const newDocs = data.map(item => ({
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
