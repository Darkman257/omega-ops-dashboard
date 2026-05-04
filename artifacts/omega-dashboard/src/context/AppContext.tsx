import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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
  internalCode: string;
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
  internalCode: string;
  notes: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  carName: string;
  plateNumber: string;
  driver: string;
  driverCode?: string;
  assignmentStatus?: string;
  fuelCardBalance: number;
  lastService: string;
  maintenanceCost: number;
  status: 'Active' | 'In Service' | 'Out of Service';
  notes: string;
  createdAt: string;
  routeName?: string;
  dailyRate?: number;
  passengerCount?: number;
}

export interface HousingUnit {
  id: string;
  unitNumber: string;
  location: string;
  capacity: number;
  occupants: number;
  status: string;
  notes: string;
  residents?: { name: string; code?: string; status?: string }[];
  createdAt: string;
}

export interface Contract {
  id: string;
  unitNumber: string;
  tenantName: string;
  rentAmount: number;
  status: 'Active' | 'Expired';
  startDate: string;
  endDate: string;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  contractId: string;
  amount: number;
  status: 'Paid' | 'Pending';
  paymentDate: string;
  notes: string;
  createdAt: string;
}

interface AppState {
  projects: Project[];
  employees: Employee[];
  documents: DocumentType[];
  payrollRecords: PayrollRecord[];
  vehicles: Vehicle[];
  housingUnits: HousingUnit[];
  contracts: Contract[];
  payments: Payment[];
  totalLiquidity: number;
  loading: boolean;
  currentUser: {
    name: string;
    role: string;
    email: string;
    department: string;
    avatar?: string;
  };
}

interface AppContextType extends AppState {
  siteFilter: string;
  setSiteFilter: (f: string) => void;
  refresh: () => Promise<void>;

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
  bulkDeleteVehicles: (ids: string[]) => void;
  bulkUpdateVehicles: (ids: string[], updates: Partial<Vehicle>) => void;

  addHousingUnit: (u: Omit<HousingUnit, 'id' | 'createdAt' | 'residents'>) => void;
  updateHousingUnit: (id: string, u: Partial<HousingUnit>) => void;
  deleteHousingUnit: (id: string) => void;

  addHousingAssignment: (unitId: string, employeeName: string, employeeCode?: string) => Promise<void>;
  deleteHousingAssignment: (unitId: string, employeeCode?: string, employeeName?: string) => Promise<void>;

  addContract: (c: Omit<Contract, 'id' | 'createdAt'>) => void;
  updateContract: (id: string, c: Partial<Contract>) => void;
  deleteContract: (id: string) => void;

  addPayment: (p: Omit<Payment, 'id' | 'createdAt'>) => void;
  updatePayment: (id: string, p: Partial<Payment>) => void;
  deletePayment: (id: string) => void;

  setTotalLiquidity: (amount: number) => void;
  importData: (type: 'staff' | 'documents' | 'payroll', data: any[]) => void;
  updateUser: (u: Partial<AppState['currentUser']>) => void;
}

// ─── DB → Frontend mappers ────────────────────────────────────────────────────

const mapProject = (row: any): Project => ({
  id: String(row.id),
  name: row.project_name ?? row.name ?? '',
  client: row.owner_name ?? row.client ?? '',
  status: row.status ?? 'Planning',
  startDate: row.start_date ?? row.startDate ?? '',
  endDate: row.end_date ?? row.endDate ?? '',
  budget: Number(row.contract_value ?? row.budget ?? 0),
  spent: Number(row.spent ?? 0),
  location: row.location ?? '',
  description: row.description ?? '',
  projectValue: Number(row.project_value ?? row.contract_value ?? row.budget ?? 0),
  consultant: row.consultant ?? '',
  subcontractors: row.subcontractors ?? '',
  completionPercent: Number(row.completion_rate ?? row.completion_percent ?? row.completionPercent ?? 0),
  technicalSpecs: row.technical_specs ?? row.technicalSpecs ?? '',
  riskLevel: row.risk_level ?? row.riskLevel ?? 'Low',
  insurancePolicyNumber: row.insurance_policy_number ?? row.insurancePolicyNumber ?? '',
  pmNotes: row.pm_notes ?? row.pmNotes ?? '',
  mepDetails: row.mep_details ?? row.mepDetails ?? '',
  civilWorks: row.civil_works ?? row.civilWorks ?? '',
  finishingStatus: row.finishing_status ?? row.finishingStatus ?? '',
  milestones: Array.isArray(row.milestones) ? row.milestones : [],
  assignedStaffIds: Array.isArray(row.assigned_staff_ids) ? row.assigned_staff_ids : [],
  createdAt: row.created_at ?? new Date().toISOString(),
});

const unmapProject = (p: Partial<Project> & { id?: string }): any => {
  const out: any = {};
  if (p.name !== undefined) out.project_name = p.name;
  if (p.client !== undefined) out.owner_name = p.client;
  if (p.budget !== undefined) out.contract_value = p.budget;
  if (p.completionPercent !== undefined) out.completion_rate = p.completionPercent;
  if (p.status !== undefined) out.status = p.status;
  if (p.startDate !== undefined) out.start_date = p.startDate;
  if (p.endDate !== undefined) out.end_date = p.endDate;
  if (p.consultant !== undefined) out.consultant = p.consultant;
  return out;
};

const mapEmployee = (row: any): Employee => ({
  id: String(row.id),
  name: row.full_name ?? row.name ?? '',
  role: row.job_title ?? row.role ?? '',
  department: row.department ?? '',
  phone: row.phone ?? '',
  email: row.email ?? '',
  status: (row.status === 'active' || row.status === 'Active') ? 'Active' : 'Inactive',
  passportExpiry: row.passport_expiry ?? '',
  insuranceStatus: row.insurance_status ?? 'Not Set',
  basicSalary: Number(row.basic_salary ?? 0),
  siteAllowance: Number(row.site_allowance ?? 0),
  currentSite: row.current_site ?? '',
  internalCode: row.internal_code ?? row.internalCode ?? '',
  createdAt: row.created_at ?? new Date().toISOString(),
});

const unmapEmployee = (e: Partial<Employee>): any => {
  const out: any = {};
  if (e.name !== undefined) out.full_name = e.name;
  if (e.role !== undefined) out.job_title = e.role;
  if (e.department !== undefined) out.department = e.department;
  if (e.phone !== undefined) out.phone = e.phone;
  if (e.email !== undefined) out.email = e.email;
  if (e.status !== undefined) out.status = e.status.toLowerCase();
  if (e.basicSalary !== undefined) out.basic_salary = e.basicSalary;
  if (e.internalCode !== undefined) out.internal_code = e.internalCode;
  return out;
};

const mapVehicle = (row: any): Vehicle => ({
  id: String(row.id),
  carName: row.car_name ?? row.carName ?? '',
  plateNumber: row.plate_number ?? row.plateNumber ?? '',
  driver: row.driver ?? '',
  driverCode: row.driver_code ?? row.driverCode ?? '',
  assignmentStatus: row.assignment_status ?? 'pending_review',
  fuelCardBalance: Number(row.fuel_balance ?? row.fuelCardBalance ?? 0),
  lastService: row.last_service ?? row.lastService ?? '',
  maintenanceCost: Number(row.maintenance_cost ?? row.maintenanceCost ?? 0),
  status: row.status ?? 'Active',
  notes: row.notes ?? '',
  routeName: row.route_name ?? '',
  dailyRate: Number(row.daily_rate ?? 0),
  passengerCount: Number(row.passenger_count ?? 0),
  createdAt: row.created_at ?? new Date().toISOString(),
});

const unmapVehicle = (v: Partial<Vehicle>): any => {
  const out: any = {};
  if (v.carName !== undefined) out.car_name = v.carName;
  if (v.plateNumber !== undefined) out.plate_number = v.plateNumber;
  if (v.driver !== undefined) out.driver = v.driver;
  if (v.driverCode !== undefined || (v as any).driver_code !== undefined) {
    out.driver_code = v.driverCode !== undefined ? v.driverCode : (v as any).driver_code;
  }
  if (v.assignmentStatus !== undefined || (v as any).assignment_status !== undefined) {
    out.assignment_status = v.assignmentStatus !== undefined ? v.assignmentStatus : (v as any).assignment_status;
  }
  if (v.fuelCardBalance !== undefined) out.fuel_balance = v.fuelCardBalance;
  if (v.lastService !== undefined) out.last_service = v.lastService;
  if (v.maintenanceCost !== undefined) out.maintenance_cost = v.maintenanceCost;
  if (v.status !== undefined) out.status = v.status;
  if (v.notes !== undefined) out.notes = v.notes;
  if (v.routeName !== undefined) out.route_name = v.routeName;
  if (v.dailyRate !== undefined) out.daily_rate = v.dailyRate;
  if (v.passengerCount !== undefined) out.passenger_count = v.passengerCount;
  return out;
};

const mapPayroll = (row: any): PayrollRecord => ({
  id: String(row.id),
  employeeName: row.employee_name ?? row.employeeName ?? '',
  role: row.role ?? '',
  department: row.department ?? '',
  siteName: row.site_name ?? row.siteName ?? '',
  month: row.month ?? '',
  basicSalary: Number(row.basic_salary ?? row.basicSalary ?? 0),
  siteAllowance: Number(row.site_allowance ?? row.siteAllowance ?? 0),
  overtimePay: Number(row.overtime_pay ?? row.overtimePay ?? 0),
  deductions: Number(row.deductions ?? 0),
  netSalary: Number(row.net_salary ?? row.netSalary ?? 0),
  status: row.status ?? 'Pending',
  internalCode: row.internal_code ?? row.internalCode ?? '',
  notes: row.notes ?? '',
  createdAt: row.created_at ?? new Date().toISOString(),
});

const unmapPayroll = (r: Partial<PayrollRecord>): any => {
  const out: any = {};
  if (r.employeeName !== undefined) out.employee_name = r.employeeName;
  if (r.role !== undefined) out.role = r.role;
  if (r.department !== undefined) out.department = r.department;
  if (r.siteName !== undefined) out.site_name = r.siteName;
  if (r.month !== undefined) out.month = r.month;
  if (r.basicSalary !== undefined) out.basic_salary = r.basicSalary;
  if (r.siteAllowance !== undefined) out.site_allowance = r.siteAllowance;
  if (r.overtimePay !== undefined) out.overtime_pay = r.overtimePay;
  if (r.deductions !== undefined) out.deductions = r.deductions;
  if (r.netSalary !== undefined) out.net_salary = r.netSalary;
  if (r.status !== undefined) out.status = r.status;
  if (r.internalCode !== undefined) out.internal_code = r.internalCode;
  return out;
};

const mapDocument = (row: any): DocumentType => ({
  id: String(row.id),
  name: row.name ?? '',
  type: row.type ?? 'Other',
  expiryDate: row.expiry_date ?? row.expiryDate ?? '',
  issuedDate: row.issued_date ?? row.issuedDate ?? '',
  projectId: row.project_id ?? row.projectId,
  notes: row.notes ?? '',
  departmentOwner: row.department_owner ?? row.departmentOwner ?? '',
  lastRenewed: row.last_renewed ?? row.lastRenewed ?? '',
  createdAt: row.created_at ?? new Date().toISOString(),
});

const unmapDocument = (d: Partial<DocumentType>): any => {
  const out: any = {};
  if (d.name !== undefined) out.name = d.name;
  if (d.type !== undefined) out.type = d.type;
  if (d.expiryDate !== undefined) out.expiry_date = d.expiryDate;
  if (d.issuedDate !== undefined) out.issued_date = d.issuedDate;
  if (d.projectId !== undefined) out.project_id = d.projectId;
  if (d.notes !== undefined) out.notes = d.notes;
  if (d.departmentOwner !== undefined) out.department_owner = d.departmentOwner;
  if (d.lastRenewed !== undefined) out.last_renewed = d.lastRenewed;
  return out;
};

const mapHousingUnit = (row: any): HousingUnit => ({
  id: String(row.id),
  unitNumber: row.unit_number ?? row.unitNumber ?? row.name ?? String(row.id),
  location: row.location ?? '',
  capacity: Number(row.capacity ?? 0),
  occupants: Number(row.occupants ?? row.current_occupants ?? 0),
  status: row.status ?? 'Available',
  notes: row.notes ?? '',
  createdAt: row.created_at ?? new Date().toISOString(),
});

const unmapHousingUnit = (u: Partial<HousingUnit>): any => {
  const out: any = {};
  if (u.unitNumber !== undefined) out.unit_number = u.unitNumber;
  if (u.location !== undefined) out.location = u.location;
  if (u.capacity !== undefined) out.capacity = u.capacity;
  if (u.status !== undefined) out.status = u.status;
  if (u.notes !== undefined) out.notes = u.notes;
  return out;
};


const mapContract = (row: any): Contract => ({
  id: String(row.id),
  unitNumber: row.unit_number ?? row.unitNumber ?? '',
  tenantName: row.tenant_name ?? row.tenantName ?? '',
  rentAmount: Number(row.rent_amount ?? row.rentAmount ?? 0),
  status: row.status === 'Expired' ? 'Expired' : 'Active',
  startDate: row.start_date ?? row.startDate ?? '',
  endDate: row.end_date ?? row.endDate ?? '',
  notes: row.notes ?? '',
  createdAt: row.created_at ?? new Date().toISOString(),
});

const unmapContract = (c: Partial<Contract>): any => {
  const out: any = {};
  if (c.unitNumber !== undefined) out.unit_number = c.unitNumber;
  if (c.tenantName !== undefined) out.tenant_name = c.tenantName;
  if (c.rentAmount !== undefined) out.rent_amount = c.rentAmount;
  if (c.status !== undefined) out.status = c.status;
  if (c.startDate !== undefined) out.start_date = c.startDate;
  if (c.endDate !== undefined) out.end_date = c.endDate;
  if (c.notes !== undefined) out.notes = c.notes;
  return out;
};

const mapPayment = (row: any): Payment => ({
  id: String(row.id),
  contractId: row.contract_id ?? row.contractId ?? '',
  amount: Number(row.amount ?? 0),
  status: row.status === 'Paid' ? 'Paid' : 'Pending',
  paymentDate: row.payment_date ?? row.paymentDate ?? '',
  notes: row.notes ?? '',
  createdAt: row.created_at ?? new Date().toISOString(),
});

const unmapPayment = (p: Partial<Payment>): any => {
  const out: any = {};
  if (p.contractId !== undefined) out.contract_id = p.contractId;
  if (p.amount !== undefined) out.amount = p.amount;
  if (p.status !== undefined) out.status = p.status;
  if (p.paymentDate !== undefined) out.payment_date = p.paymentDate;
  if (p.notes !== undefined) out.notes = p.notes;
  return out;
};


// ─── Storage key for liquidity (no dedicated Supabase table) ─────────────────
const LIQUIDITY_KEY = 'omega-liquidity';

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    projects: [],
    employees: [],
    documents: [],
    payrollRecords: [],
    vehicles: [],
    housingUnits: [],
    contracts: [],
    payments: [],
    totalLiquidity: Number(localStorage.getItem(LIQUIDITY_KEY) ?? 0),
    loading: true,
    currentUser: JSON.parse(localStorage.getItem('omega-user') || JSON.stringify({
      name: 'Admin User',
      role: 'Executive Manager',
      email: 'admin@omega.com',
      department: 'Executive Office'
    })),
  });
  const [siteFilter, setSiteFilter] = useState('');

  const safeQuery = async (table: string, order?: string) => {
    try {
      const q = supabase.from(table).select('*');
      const res = order ? await q.order(order, { ascending: false }) : await q;
      if (res.error) {
        // retry without order if ordering failed
        if (order && res.error.code === '42703') {
          const r2 = await supabase.from(table).select('*');
          if (r2.error) { console.warn(`[${table}]`, r2.error.message); return []; }
          return r2.data ?? [];
        }
        console.warn(`[${table}]`, res.error.message);
        return [];
      }
      return res.data ?? [];
    } catch (e) {
      console.warn(`[${table}] unexpected error`, e);
      return [];
    }
  };

  const refresh = async () => {
    setState(prev => ({ ...prev, loading: true }));

    const [projectsData, staffData, vehiclesData, payrollData, docsData, housingData, contractsData, paymentsData, housingAssignmentsData] = await Promise.all([
      safeQuery('projects', 'created_at'),
      safeQuery('staff'),
      safeQuery('vehicles', 'created_at'),
      safeQuery('payroll_records', 'created_at'),
      safeQuery('documents', 'created_at'),
      safeQuery('housing_units'),
      safeQuery('contracts'),
      safeQuery('payments'),
      safeQuery('housing_assignments'),
    ]);

    // robust fallback to localStorage if Supabase returns nothing or hasn't had the tables created yet
    let finalContracts = contractsData.map(mapContract);
    if (finalContracts.length === 0) {
      try {
        const localCached = localStorage.getItem('omega_contracts');
        if (localCached) finalContracts = JSON.parse(localCached);
      } catch (e) { console.warn(e); }
    }

    let finalPayments = paymentsData.map(mapPayment);
    if (finalPayments.length === 0) {
      try {
        const localCached = localStorage.getItem('omega_payments');
        if (localCached) finalPayments = JSON.parse(localCached);
      } catch (e) { console.warn(e); }
    }

    const mappedUnits = housingData.map(mapHousingUnit).map(unit => {
      const unitAssignments = housingAssignmentsData.filter((a: any) => String(a.housing_unit_id) === String(unit.id));
      const residents = unitAssignments.map((a: any) => ({
        name: a.employee_name || 'Unknown',
        code: a.employee_code || undefined,
        status: a.assignment_status || 'linked'
      }));
      return {
        ...unit,
        residents,
        occupants: residents.length // Computed count
      };
    });

    setState(prev => ({
      ...prev,
      projects: projectsData.map(mapProject),
      employees: staffData.map(mapEmployee),
      vehicles: vehiclesData.map(mapVehicle),
      payrollRecords: payrollData.map(mapPayroll),
      documents: docsData.map(mapDocument),
      housingUnits: mappedUnits,
      contracts: finalContracts,
      payments: finalPayments,
      loading: false,
    }));
  };

  useEffect(() => { refresh(); }, []);

  // ─── Projects ─────────────────────────────────────────────────────────────

  const addProject = (p: Omit<Project, 'id' | 'createdAt'>) => {
    const tempId = crypto.randomUUID();
    const newItem: Project = { ...p, id: tempId, createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, projects: [newItem, ...prev.projects] }));
    supabase.from('projects').insert([unmapProject(p)]).select().single()
      .then(({ data, error }) => {
        if (error) { console.error('addProject:', error); return; }
        if (data) setState(prev => ({
          ...prev,
          projects: prev.projects.map(x => x.id === tempId ? mapProject(data) : x),
        }));
      });
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setState(prev => ({ ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p) }));
    supabase.from('projects').update(unmapProject(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateProject:', error); });
  };

  const deleteProject = (id: string) => {
    setState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    supabase.from('projects').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteProject:', error); });
  };

  // ─── Staff ────────────────────────────────────────────────────────────────

  const addEmployee = (e: Omit<Employee, 'id' | 'createdAt'>) => {
    const tempId = crypto.randomUUID();
    const newItem: Employee = { ...e, id: tempId, createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, employees: [newItem, ...prev.employees] }));
    supabase.from('staff').insert([unmapEmployee(e)]).select().single()
      .then(({ data, error }) => {
        if (error) { console.error('addEmployee:', error); return; }
        if (data) setState(prev => ({
          ...prev,
          employees: prev.employees.map(x => x.id === tempId ? mapEmployee(data) : x),
        }));
      });
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setState(prev => ({ ...prev, employees: prev.employees.map(e => e.id === id ? { ...e, ...updates } : e) }));
    supabase.from('staff').update(unmapEmployee(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateEmployee:', error); });
  };

  const deleteEmployee = (id: string) => {
    setState(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== id) }));
    supabase.from('staff').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteEmployee:', error); });
  };

  // ─── Documents ────────────────────────────────────────────────────────────

  const addDocument = (d: Omit<DocumentType, 'id' | 'createdAt'>) => {
    const tempId = crypto.randomUUID();
    const newItem: DocumentType = { ...d, id: tempId, createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, documents: [newItem, ...prev.documents] }));
    supabase.from('documents').insert([unmapDocument(d)]).select().single()
      .then(({ data, error }) => {
        if (error) { console.error('addDocument:', error); return; }
        if (data) setState(prev => ({
          ...prev,
          documents: prev.documents.map(x => x.id === tempId ? mapDocument(data) : x),
        }));
      });
  };

  const updateDocument = (id: string, updates: Partial<DocumentType>) => {
    setState(prev => ({ ...prev, documents: prev.documents.map(d => d.id === id ? { ...d, ...updates } : d) }));
    supabase.from('documents').update(unmapDocument(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateDocument:', error); });
  };

  const deleteDocument = (id: string) => {
    setState(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
    supabase.from('documents').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteDocument:', error); });
  };

  // ─── Payroll ──────────────────────────────────────────────────────────────

  const addPayrollRecord = (r: Omit<PayrollRecord, 'id' | 'createdAt'>) => {
    const tempId = crypto.randomUUID();
    const newItem: PayrollRecord = { ...r, id: tempId, createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, payrollRecords: [newItem, ...prev.payrollRecords] }));
    supabase.from('payroll_records').insert([unmapPayroll(r)]).select().single()
      .then(({ data, error }) => {
        if (error) { console.error('addPayrollRecord:', error); return; }
        if (data) setState(prev => ({
          ...prev,
          payrollRecords: prev.payrollRecords.map(x => x.id === tempId ? mapPayroll(data) : x),
        }));
      });
  };

  const updatePayrollRecord = (id: string, updates: Partial<PayrollRecord>) => {
    setState(prev => ({ ...prev, payrollRecords: prev.payrollRecords.map(r => r.id === id ? { ...r, ...updates } : r) }));
    supabase.from('payroll_records').update(unmapPayroll(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('updatePayrollRecord:', error); });
  };

  const deletePayrollRecord = (id: string) => {
    setState(prev => ({ ...prev, payrollRecords: prev.payrollRecords.filter(r => r.id !== id) }));
    supabase.from('payroll_records').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deletePayrollRecord:', error); });
  };

  // ─── Vehicles ─────────────────────────────────────────────────────────────

  const addVehicle = (v: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const tempId = crypto.randomUUID();
    const newItem: Vehicle = { ...v, id: tempId, createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, vehicles: [newItem, ...prev.vehicles] }));
    supabase.from('vehicles').insert([unmapVehicle(v)]).select().single()
      .then(({ data, error }) => {
        if (error) { console.error('addVehicle:', error); return; }
        if (data) setState(prev => ({
          ...prev,
          vehicles: prev.vehicles.map(x => x.id === tempId ? mapVehicle(data) : x),
        }));
      });
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    // Optimistic update
    setState(prev => ({ ...prev, vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...updates } : v) }));
    supabase.from('vehicles').update(unmapVehicle(updates)).eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('updateVehicle:', error);
        } else {
          // Re-fetch to confirm DB state matches, recalculates tab counts
          refresh();
        }
      });
  };

  const deleteVehicle = (id: string) => {
    setState(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== id) }));
    supabase.from('vehicles').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteVehicle:', error); });
  };

  const bulkDeleteVehicles = (ids: string[]) => {
    setState(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => !ids.includes(v.id)) }));
    supabase.from('vehicles').delete().in('id', ids)
      .then(({ error }) => { if (error) console.error('bulkDeleteVehicles:', error); });
  };

  const bulkUpdateVehicles = (ids: string[], updates: Partial<Vehicle>) => {
    setState(prev => ({ ...prev, vehicles: prev.vehicles.map(v => ids.includes(v.id) ? { ...v, ...updates } : v) }));
    supabase.from('vehicles').update(unmapVehicle(updates)).in('id', ids)
      .then(({ error }) => { if (error) console.error('bulkUpdateVehicles:', error); });
  };

  // ─── Housing Units ────────────────────────────────────────────────────────

  const addHousingUnit = (u: Omit<HousingUnit, 'id' | 'createdAt' | 'residents'>) => {
    const tempId = crypto.randomUUID();
    const newItem: HousingUnit = { ...u, id: tempId, createdAt: new Date().toISOString(), residents: [], occupants: 0 };
    setState(prev => ({ ...prev, housingUnits: [newItem, ...prev.housingUnits] }));
    supabase.from('housing_units').insert([unmapHousingUnit(u)]).select().single()
      .then(({ data, error }) => {
        if (error) { console.error('addHousingUnit:', error); return; }
        if (data) refresh(); // Re-fetch to get correct associations
      });
  };

  const updateHousingUnit = (id: string, updates: Partial<HousingUnit>) => {
    setState(prev => ({ ...prev, housingUnits: prev.housingUnits.map(u => u.id === id ? { ...u, ...updates } : u) }));
    supabase.from('housing_units').update(unmapHousingUnit(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateHousingUnit:', error); });
  };

  const deleteHousingUnit = (id: string) => {
    setState(prev => ({ ...prev, housingUnits: prev.housingUnits.filter(u => u.id !== id) }));
    supabase.from('housing_units').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteHousingUnit:', error); });
  };

  const addHousingAssignment = async (unitId: string, employeeName: string, employeeCode?: string) => {
    const { error } = await supabase.from('housing_assignments').insert([{
      housing_unit_id: unitId,
      employee_name: employeeName,
      employee_code: employeeCode,
      assignment_status: 'linked'
    }]);
    if (!error) refresh(); // Refresh to get updated residents
  };

  const deleteHousingAssignment = async (unitId: string, employeeCode?: string, employeeName?: string) => {
    let q = supabase.from('housing_assignments').delete().eq('housing_unit_id', unitId);
    if (employeeCode) q = q.eq('employee_code', employeeCode);
    else if (employeeName) q = q.eq('employee_name', employeeName);
    
    const { error } = await q;
    if (!error) refresh(); // Refresh to get updated residents
  };

  // ─── Liquidity ────────────────────────────────────────────────────────────

  const setTotalLiquidity = (amount: number) => {
    localStorage.setItem(LIQUIDITY_KEY, String(amount));
    setState(prev => ({ ...prev, totalLiquidity: amount }));
  };

  // ─── Bulk Import ──────────────────────────────────────────────────────────

  const importData = (type: 'staff' | 'documents' | 'payroll', data: any[]) => {
    const pick = (item: any, ...keys: string[]) => {
      for (const k of keys) {
        const v = item[k] ?? item[k.toLowerCase()] ?? item[k.toUpperCase()];
        if (v !== undefined && v !== '') return v;
      }
      return undefined;
    };

    if (type === 'staff') {
      const rows = data.map(item => ({
        full_name: String(pick(item, 'name', 'Name', 'الاسم', 'مسال', 'full_name', 'employeeName') ?? ''),
        job_title: String(pick(item, 'role', 'Role', 'الوظيفة', 'قفيظولا', 'job_title', 'position', 'المسمى') ?? ''),
        department: String(pick(item, 'department', 'القسم', 'تاردإلا', 'dept') ?? ''),
        phone: String(pick(item, 'phone', 'mobile', 'تليفون', 'الهاتف', 'tel') ?? ''),
        email: String(pick(item, 'email', 'البريد', 'البريد الإلكتروني') ?? ''),
        basic_salary: Number(pick(item, 'basicSalary', 'basic_salary', 'الراتب الأساسي', 'الراتب', 'salary') ?? 0),
        internal_code: String(pick(item, 'internalCode', 'internal_code', 'code', 'id', 'الرقم الوظيفي', 'كود') ?? ''),
        status: String(pick(item, 'status', 'الحالة') ?? 'active').toLowerCase(),
        site_allowance: 0,
        current_site: '',
      })).filter(r => r.full_name && r.internal_code);

      supabase.from('staff').insert(rows).select()
        .then(({ data: inserted, error }) => {
          if (error) { console.error('import staff:', error); return; }
          if (inserted) setState(prev => ({
            ...prev,
            employees: [...(inserted).map(mapEmployee), ...prev.employees],
          }));
        });
    } else if (type === 'documents') {
      const rows = data.map(item => ({
        name: String(pick(item, 'name', 'title', 'الاسم', 'doc') ?? ''),
        type: String(pick(item, 'type', 'category', 'نوع') ?? 'Other'),
        expiry_date: String(pick(item, 'expiryDate', 'expiry_date', 'expiry', 'end', 'تاريخ الانتهاء') ?? ''),
        issued_date: String(pick(item, 'issuedDate', 'issued_date', 'issue', 'start', 'تاريخ الإصدار') ?? ''),
        notes: String(pick(item, 'notes', 'ملاحظات') ?? ''),
        department_owner: String(pick(item, 'departmentOwner', 'department', 'القسم') ?? ''),
      })).filter(r => r.name);

      supabase.from('documents').insert(rows).select()
        .then(({ data: inserted, error }) => {
          if (error) { console.error('import documents:', error); return; }
          if (inserted) setState(prev => ({
            ...prev,
            documents: [...(inserted).map(mapDocument), ...prev.documents],
          }));
        });
    } else if (type === 'payroll') {
      const rows = data.map(item => {
        const basic = Number(pick(item, 'basicSalary', 'basic_salary', 'الراتب الأساسي', 'الراتب', 'salary') ?? 0);
        const allowance = Number(pick(item, 'siteAllowance', 'site_allowance', 'بدل الموقع', 'بدل') ?? 0);
        const overtime = Number(pick(item, 'overtimePay', 'overtime_pay', 'إضافي', 'الاضافي', 'OT') ?? 0);
        const deductions = Number(pick(item, 'deductions', 'خصومات', 'استقطاعات', 'سلف') ?? 0);
        const net = Number(pick(item, 'netSalary', 'net_salary', 'الصافي') ?? 0);
        
        return {
          employee_name: String(pick(item, 'employeeName', 'employee_name', 'اسم الموظف', 'الاسم') ?? ''),
          internal_code: String(pick(item, 'internalCode', 'internal_code', 'code', 'id', 'الرقم الوظيفي', 'كود') ?? ''),
          month: String(pick(item, 'month', 'الشهر') ?? new Date().toISOString().slice(0, 7)),
          basic_salary: basic,
          site_allowance: allowance,
          overtime_pay: overtime,
          deductions,
          net_salary: net || Math.max(0, basic + allowance + overtime - deductions),
          notes: String(pick(item, 'notes', 'ملاحظات') ?? ''),
          role: '',
          department: '',
          site_name: '',
          status: 'Pending',
        };
      }).filter(r => r.employee_name && r.internal_code);

      supabase.from('payroll_records').insert(rows).select()
        .then(({ data: inserted, error }) => {
          if (error) { console.error('import payroll:', error); return; }
          if (inserted) setState(prev => ({
            ...prev,
            payrollRecords: [...(inserted).map(mapPayroll), ...prev.payrollRecords],
          }));
        });
    }
  };

  const addContract = (c: Omit<Contract, 'id' | 'createdAt'>) => {
    const tempId = crypto.randomUUID();
    const newItem: Contract = { ...c, id: tempId, createdAt: new Date().toISOString() };
    setState(prev => {
      const next = [newItem, ...prev.contracts];
      localStorage.setItem('omega_contracts', JSON.stringify(next));
      return { ...prev, contracts: next };
    });
    supabase.from('contracts').insert([unmapContract(c)]).select().single()
      .then(({ data, error }) => {
        if (error) { console.error('addContract:', error); return; }
        if (data) setState(prev => {
          const next = prev.contracts.map(x => x.id === tempId ? mapContract(data) : x);
          localStorage.setItem('omega_contracts', JSON.stringify(next));
          return { ...prev, contracts: next };
        });
      });
  };

  const updateContract = (id: string, updates: Partial<Contract>) => {
    setState(prev => {
      const next = prev.contracts.map(c => c.id === id ? { ...c, ...updates } : c);
      localStorage.setItem('omega_contracts', JSON.stringify(next));
      return { ...prev, contracts: next };
    });
    supabase.from('contracts').update(unmapContract(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateContract:', error); });
  };

  const deleteContract = (id: string) => {
    setState(prev => {
      const next = prev.contracts.filter(c => c.id !== id);
      localStorage.setItem('omega_contracts', JSON.stringify(next));
      return { ...prev, contracts: next };
    });
    supabase.from('contracts').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteContract:', error); });
  };

  const addPayment = (p: Omit<Payment, 'id' | 'createdAt'>) => {
    const tempId = crypto.randomUUID();
    const newItem: Payment = { ...p, id: tempId, createdAt: new Date().toISOString() };
    setState(prev => {
      const next = [newItem, ...prev.payments];
      localStorage.setItem('omega_payments', JSON.stringify(next));
      return { ...prev, payments: next };
    });
    supabase.from('payments').insert([unmapPayment(p)]).select().single()
      .then(({ data, error }) => {
        if (error) { console.error('addPayment:', error); return; }
        if (data) setState(prev => {
          const next = prev.payments.map(x => x.id === tempId ? mapPayment(data) : x);
          localStorage.setItem('omega_payments', JSON.stringify(next));
          return { ...prev, payments: next };
        });
      });
  };

  const updatePayment = (id: string, updates: Partial<Payment>) => {
    setState(prev => {
      const next = prev.payments.map(p => p.id === id ? { ...p, ...updates } : p);
      localStorage.setItem('omega_payments', JSON.stringify(next));
      return { ...prev, payments: next };
    });
    supabase.from('payments').update(unmapPayment(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('updatePayment:', error); });
  };

  const deletePayment = (id: string) => {
    setState(prev => {
      const next = prev.payments.filter(p => p.id !== id);
      localStorage.setItem('omega_payments', JSON.stringify(next));
      return { ...prev, payments: next };
    });
    supabase.from('payments').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deletePayment:', error); });
  };

  const updateUser = (u: Partial<AppState['currentUser']>) => {
    setState(prev => {
      const newUser = { ...prev.currentUser, ...u };
      localStorage.setItem('omega-user', JSON.stringify(newUser));
      return { ...prev, currentUser: newUser };
    });
  };

  return (
    <AppContext.Provider value={{
      ...state,
      siteFilter, setSiteFilter,
      refresh,
      addProject, updateProject, deleteProject,
      addEmployee, updateEmployee, deleteEmployee,
      addDocument, updateDocument, deleteDocument,
      addPayrollRecord, updatePayrollRecord, deletePayrollRecord,
      addVehicle, updateVehicle, deleteVehicle, bulkDeleteVehicles, bulkUpdateVehicles,
      addHousingUnit, updateHousingUnit, deleteHousingUnit,
      addHousingAssignment, deleteHousingAssignment,
      addContract, updateContract, deleteContract,
      addPayment, updatePayment, deletePayment,
      setTotalLiquidity,
      importData,
      updateUser,
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
