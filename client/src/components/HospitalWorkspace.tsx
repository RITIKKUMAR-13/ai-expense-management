/**
 * MedoraCare workspace: authenticated administrative tools only. Patient data is user-scoped,
 * excludes clinical notes, and is never shown without the project authentication context.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Activity, ArrowRight, CalendarDays, CheckCircle2, Clock3, Moon, Plus, Sun, UsersRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type PatientStatus = "waiting" | "checkedIn" | "withDoctor" | "completed";
type AppointmentStatus = "scheduled" | "checkedIn" | "completed" | "cancelled";

const patientStatusMeta: Record<PatientStatus, { label: string; next: PatientStatus }> = {
  waiting: { label: "Waiting", next: "checkedIn" },
  checkedIn: { label: "Checked in", next: "withDoctor" },
  withDoctor: { label: "With doctor", next: "completed" },
  completed: { label: "Completed", next: "waiting" },
};

const appointmentStatusMeta: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  checkedIn: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
};

function PanelHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="workspace-panel-header"><div><p className="workspace-eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>;
}

function PatientDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const createPatient = trpc.hospital.patients.create.useMutation({
    onSuccess: () => { onCreated(); setOpen(false); toast.success("Patient record added to the private directory."); },
    onError: (error) => toast.error(error.message),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createPatient.mutate({
      displayName: String(form.get("displayName") || ""),
      patientCode: String(form.get("patientCode") || ""),
      age: Number(form.get("age") || 0),
      phone: String(form.get("phone") || "") || undefined,
    });
  };

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button className="hospital-primary"><Plus size={16} /> Add patient</Button></DialogTrigger>
    <DialogContent className="hospital-dialog sm:max-w-[470px]">
      <DialogHeader><DialogTitle className="hospital-dialog-title">Add a patient</DialogTitle><DialogDescription>Administrative details only. Do not enter diagnoses, clinical notes, or other sensitive information.</DialogDescription></DialogHeader>
      <form className="hospital-form" onSubmit={submit}>
        <label>Patient name<Input name="displayName" required placeholder="e.g. Patient Example" /></label>
        <div className="hospital-form-grid"><label>Patient ID<Input name="patientCode" required placeholder="e.g. P-014" /></label><label>Age<Input name="age" required type="number" min="0" max="130" placeholder="e.g. 34" /></label></div>
        <label>Phone (optional)<Input name="phone" inputMode="tel" placeholder="e.g. +91 98765 43210" /></label>
        <div className="hospital-form-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createPatient.isPending} className="hospital-primary">{createPatient.isPending ? "Saving…" : "Save patient"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

function AppointmentDialog({ patients, onCreated }: { patients: Array<{ id: number; displayName: string; patientCode: string }>; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const createAppointment = trpc.hospital.appointments.create.useMutation({
    onSuccess: () => { onCreated(); setOpen(false); toast.success("Appointment added to today’s coordination board."); },
    onError: (error) => toast.error(error.message),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scheduledValue = String(form.get("scheduledAt") || "");
    createAppointment.mutate({
      patientId: Number(form.get("patientId")),
      department: String(form.get("department") || ""),
      scheduledAt: new Date(scheduledValue),
      note: String(form.get("note") || "") || undefined,
    });
  };

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button disabled={patients.length === 0} className="hospital-primary"><CalendarDays size={16} /> New appointment</Button></DialogTrigger>
    <DialogContent className="hospital-dialog sm:max-w-[470px]">
      <DialogHeader><DialogTitle className="hospital-dialog-title">Schedule an appointment</DialogTitle><DialogDescription>Choose an existing patient and an administrative visit slot.</DialogDescription></DialogHeader>
      <form className="hospital-form" onSubmit={submit}>
        <label>Patient<select name="patientId" required defaultValue=""> <option value="" disabled>Select a patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.displayName} · {patient.patientCode}</option>)}</select></label>
        <label>Department<select name="department" required defaultValue=""><option value="" disabled>Select a department</option><option>Outpatient reception</option><option>General consultation</option><option>Diagnostics desk</option><option>Billing & discharge</option></select></label>
        <label>Scheduled time<Input name="scheduledAt" required type="datetime-local" /></label>
        <label>Coordination note (optional)<Input name="note" maxLength={240} placeholder="e.g. Bring previous referral" /></label>
        <div className="hospital-form-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createAppointment.isPending} className="hospital-primary">{createAppointment.isPending ? "Scheduling…" : "Save appointment"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

export default function HospitalWorkspace() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();
  const [patientFilter, setPatientFilter] = useState("");
  const dashboard = trpc.hospital.dashboard.useQuery(undefined, { retry: false });
  const isManager = user?.role === "admin";
  const operations = trpc.hospital.operations.useQuery(undefined, { enabled: isManager, retry: false });
  const updatePatient = trpc.hospital.patients.updateStatus.useMutation({ onSuccess: () => utils.hospital.dashboard.invalidate(), onError: (error) => toast.error(error.message) });
  const updateAppointment = trpc.hospital.appointments.updateStatus.useMutation({ onSuccess: () => utils.hospital.dashboard.invalidate(), onError: (error) => toast.error(error.message) });
  const page = typeof window === "undefined" ? "/" : window.location.pathname;

  const patients = dashboard.data?.patients ?? [];
  const appointments = dashboard.data?.appointments ?? [];
  const filteredPatients = useMemo(() => patients.filter((patient) => `${patient.displayName} ${patient.patientCode}`.toLowerCase().includes(patientFilter.toLowerCase())), [patients, patientFilter]);
  const refresh = () => utils.hospital.dashboard.invalidate();

  const titleMap: Record<string, { eyebrow: string; title: string; copy: string }> = {
    "/": { eyebrow: isManager ? "HOSPITAL MANAGER" : "RECEPTION DESK", title: `Good day, ${user?.name?.split(" ")[0] || "team"}.`, copy: isManager ? "Review today’s operational capacity and administrative patient flow." : "Coordinate arrivals, appointments and patient flow with confidence." },
    "/patients": { eyebrow: "PATIENT DIRECTORY", title: "Administrative patient records", copy: "Create and manage only the minimum coordination details needed for your current workspace." },
    "/appointments": { eyebrow: "APPOINTMENT BOARD", title: "Keep every visit in view", copy: "Schedule and update administrative appointment states in one focused board." },
    "/operations": { eyebrow: "OPERATIONS", title: "Capacity at a glance", copy: "Manager-only overview of care flow and operational readiness." },
  };
  const pageInfo = titleMap[page] ?? titleMap["/"];

  const renderPatientTable = () => <div className="data-list">
    {filteredPatients.length === 0 ? <div className="empty-state"><UsersRound size={24} /><p>No administrative patient records yet.</p><small>Use “Add patient” to begin your private directory.</small></div> : filteredPatients.map((patient) => {
      const meta = patientStatusMeta[patient.status as PatientStatus];
      return <div className="data-row" key={patient.id}><div className="avatar-chip">{patient.displayName.slice(0, 2).toUpperCase()}</div><div className="data-name"><strong>{patient.displayName}</strong><span>{patient.patientCode} · Age {patient.age}</span></div><span className={`status-pill status-${patient.status}`}>{meta.label}</span><button className="row-action" disabled={updatePatient.isPending} onClick={() => updatePatient.mutate({ id: patient.id, status: meta.next })}>{meta.next === "checkedIn" ? "Check in" : meta.next === "withDoctor" ? "Send to care" : meta.next === "completed" ? "Complete" : "Reopen"}<ArrowRight size={14} /></button></div>;
    })}
  </div>;

  const renderAppointments = () => <div className="data-list">
    {appointments.length === 0 ? <div className="empty-state"><CalendarDays size={24} /><p>No appointments scheduled.</p><small>Add a patient first, then create an appointment from this board.</small></div> : appointments.map((appointment) => <div className="data-row" key={appointment.id}><div className="time-block"><strong>{format(new Date(appointment.scheduledAt), "HH:mm")}</strong><span>{format(new Date(appointment.scheduledAt), "dd MMM")}</span></div><div className="data-name"><strong>{appointment.patientName}</strong><span>{appointment.department} · {appointment.patientCode}</span></div><span className={`status-pill status-${appointment.status}`}>{appointmentStatusMeta[appointment.status as AppointmentStatus]}</span><button className="row-action" disabled={updateAppointment.isPending} onClick={() => updateAppointment.mutate({ id: appointment.id, status: appointment.status === "scheduled" ? "checkedIn" : "completed" })}>{appointment.status === "scheduled" ? "Check in" : "Complete"}<ArrowRight size={14} /></button></div>)}
  </div>;

  if (dashboard.isLoading) return <div className="workspace-loading">Loading MedoraCare workspace…</div>;
  if (dashboard.error) return <div className="workspace-loading"><p>We could not load the secure workspace.</p><Button onClick={() => dashboard.refetch()} className="hospital-primary">Try again</Button></div>;

  return <DashboardLayout><div className="hospital-workspace">
    <header className="workspace-top"><div><p className="workspace-eyebrow">{pageInfo.eyebrow}</p><h1>{pageInfo.title}</h1><p className="workspace-lead">{pageInfo.copy}</p></div><div className="workspace-tools"><button onClick={toggleTheme} className="theme-icon" aria-label="Toggle dark mode">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><span className="role-badge">{isManager ? "Hospital Manager" : "Receptionist"}</span></div></header>

    {page === "/" && <>
      <section className="stat-grid"><article><span><UsersRound size={18} /></span><p>Active directory</p><strong>{dashboard.data?.stats.totalPatients ?? 0}</strong><small>Patient records in your workspace</small></article><article><span><Clock3 size={18} /></span><p>Waiting now</p><strong>{dashboard.data?.stats.waiting ?? 0}</strong><small>Ready for desk coordination</small></article><article><span><CheckCircle2 size={18} /></span><p>Checked in</p><strong>{dashboard.data?.stats.checkedIn ?? 0}</strong><small>Currently in active flow</small></article><article><span><CalendarDays size={18} /></span><p>Scheduled</p><strong>{dashboard.data?.stats.scheduled ?? 0}</strong><small>Appointments on the board</small></article></section>
      <section className="workspace-grid"><article className="workspace-panel"><PanelHeader eyebrow="FRONT DESK PULSE" title="Patient flow" action={<PatientDialog onCreated={refresh} />} />{renderPatientTable()}</article><article className="workspace-panel focus-panel"><PanelHeader eyebrow="NEXT ACTION" title="Keep the day moving" /><div className="focus-orbit"><b /><i /><i /><i /></div><p className="focus-number">{(dashboard.data?.stats.waiting ?? 0) + (dashboard.data?.stats.checkedIn ?? 0)}</p><p className="focus-copy">Patients currently need coordination.</p><button onClick={() => setLocation("/appointments")} className="focus-link">Open appointment board <ArrowRight size={15} /></button></article></section>
      <section className="workspace-panel mt-panel"><PanelHeader eyebrow="TODAY’S APPOINTMENTS" title="Coordination board" action={<AppointmentDialog patients={patients.map(({ id, displayName, patientCode }) => ({ id, displayName, patientCode }))} onCreated={refresh} />} />{renderAppointments()}</section>
    </>}

    {page === "/patients" && <section className="workspace-panel"><PanelHeader eyebrow="PRIVATE DIRECTORY" title="Patient records" action={<PatientDialog onCreated={refresh} />} /><div className="list-toolbar"><Input value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)} placeholder="Search name or patient ID" /><span>{filteredPatients.length} record{filteredPatients.length === 1 ? "" : "s"}</span></div>{renderPatientTable()}</section>}
    {page === "/appointments" && <section className="workspace-panel"><PanelHeader eyebrow="SCHEDULE" title="Appointments" action={<AppointmentDialog patients={patients.map(({ id, displayName, patientCode }) => ({ id, displayName, patientCode }))} onCreated={refresh} />} />{patients.length === 0 && <p className="inline-note">Add a patient record before scheduling an appointment.</p>}{renderAppointments()}</section>}
    {page === "/operations" && (isManager ? <section className="operations-layout"><div className="manager-callout"><p className="workspace-eyebrow">MANAGER VIEW</p><h2>Care flow is clear when the signals are visible.</h2><p>Use this overview for administrative coordination. It intentionally excludes clinical content.</p><div className="signal-bars"><i /><i /><i /><i /><i /><i /></div></div><section className="stat-grid manager-stats"><article><span><Activity size={18} /></span><p>Active care load</p><strong>{operations.data?.activeCareLoad ?? 0}</strong><small>Checked in or in active care flow</small></article><article><span><CalendarDays size={18} /></span><p>Scheduled visits</p><strong>{operations.data?.scheduledAppointments ?? 0}</strong><small>Awaiting front-desk coordination</small></article><article><span><CheckCircle2 size={18} /></span><p>Completed visits</p><strong>{operations.data?.completedVisits ?? 0}</strong><small>Administrative status completed</small></article></section><section className="workspace-panel"><PanelHeader eyebrow="WORKFORCE PULSE" title="Operational focus" /><div className="workforce-row"><span>Reception capacity</span><div><i style={{ width: "76%" }} /></div><strong>76%</strong></div><div className="workforce-row"><span>Appointment readiness</span><div><i style={{ width: "88%" }} /></div><strong>88%</strong></div><div className="workforce-row"><span>Patient flow completion</span><div><i style={{ width: `${dashboard.data?.stats.totalPatients ? Math.round(((operations.data?.completedVisits ?? 0) / dashboard.data.stats.totalPatients) * 100) : 0}%` }} /></div><strong>{dashboard.data?.stats.totalPatients ? Math.round(((operations.data?.completedVisits ?? 0) / dashboard.data.stats.totalPatients) * 100) : 0}%</strong></div></section></section> : <div className="workspace-loading"><p>Operations is available to Hospital Manager accounts only.</p><Button onClick={() => setLocation("/")} className="hospital-primary">Back to overview</Button></div>)}
  </div></DashboardLayout>;
}
