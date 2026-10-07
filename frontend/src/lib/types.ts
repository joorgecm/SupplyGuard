// Reflejan los esquemas Pydantic de backend/app/schemas

export type Role = "operator" | "engineer" | "admin";
export type Severity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "in_analysis" | "corrective_action" | "closed";

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
};

export type UserSummary = {
  id: number;
  full_name: string;
};

export type Supplier = {
  id: number;
  name: string;
  contact_email: string | null;
  is_active: boolean;
};

export type Part = {
  id: number;
  reference: string;
  lot: string;
  description: string | null;
  supplier: Supplier;
};

export type Task = {
  id: number;
  action_plan_id: number;
  title: string;
  due_date: string;
  completed_at: string | null;
  assigned_to: UserSummary;
};

export type ActionPlan = {
  id: number;
  incident_id: number;
  description: string;
  created_at: string;
  created_by: UserSummary;
  tasks: Task[];
};

export type HistoryEvent = {
  id: number;
  action: string;
  from_status: IncidentStatus | null;
  to_status: IncidentStatus | null;
  created_at: string;
  user: UserSummary;
};

export type Incident = {
  id: number;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  photo_url: string | null;
  created_at: string;
  closed_at: string | null;
  part: Part;
  reported_by: UserSummary;
  analyzed_by: UserSummary | null;
};

export type IncidentDetail = Incident & {
  action_plan: ActionPlan | null;
  history: HistoryEvent[];
};
