/** Savings Goals UI: user-owned target purchases, additive deposits, and transparent progress. */
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { getSavingsProgress } from "@/lib/savingsMath";
import { format } from "date-fns";
import { House, Laptop, PiggyBank, Plane, Plus, Smartphone } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const asCurrency = (paise: number) => money.format(paise / 100);
const goalIcons: Record<string, { label: string; icon: typeof Laptop }> = {
  laptop: { label: "Laptop", icon: Laptop },
  mobile: { label: "Mobile", icon: Smartphone },
  travel: { label: "Travel", icon: Plane },
  home: { label: "Home", icon: House },
  other: { label: "Other", icon: PiggyBank },
};

function GoalDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const create = trpc.finance.savings.create.useMutation({
    onSuccess: () => { onSaved(); setOpen(false); toast.success("Savings goal created. Add money whenever you are ready."); },
    onError: (error) => toast.error(error.message),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("targetDate") || "");
    create.mutate({
      title: String(form.get("title") || ""),
      icon: String(form.get("icon")) as "laptop" | "mobile" | "travel" | "home" | "other",
      targetPaise: Math.round(Number(form.get("target")) * 100),
      targetDate: date ? new Date(`${date}T00:00:00`) : undefined,
    });
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="expense-primary"><Plus size={16} /> New savings goal</Button></DialogTrigger><DialogContent className="expense-dialog sm:max-w-[500px]"><DialogHeader><DialogTitle className="expense-dialog-title">Save for an important purchase</DialogTitle><DialogDescription>Set a target for a laptop, mobile, travel, or any other personal purchase.</DialogDescription></DialogHeader><form className="savings-form" onSubmit={submit}><label>Goal name<Input name="title" required placeholder="e.g. New laptop" /></label><div><label>Choose an icon</label><div className="savings-icon-picker">{Object.entries(goalIcons).map(([key, option]) => { const Icon = option.icon; return <label className="savings-icon-choice" key={key} title={option.label}><input type="radio" name="icon" value={key} defaultChecked={key === "laptop"} /><Icon size={20} /></label>; })}</div></div><div className="savings-form-grid"><label>Target amount (₹)<Input name="target" required type="number" min="1" step="1" placeholder="e.g. 75000" /></label><label>Target date (optional)<Input name="targetDate" type="date" /></label></div><div className="savings-form-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="expense-primary" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create goal"}</Button></div></form></DialogContent></Dialog>;
}

function ContributionDialog({ goal, onSaved }: { goal: { id: number; title: string; status: string }; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const contribute = trpc.finance.savings.contribute.useMutation({
    onSuccess: () => { onSaved(); setOpen(false); toast.success("Savings added to your goal."); },
    onError: (error) => toast.error(error.message),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    contribute.mutate({ goalId: goal.id, amountPaise: Math.round(Number(form.get("amount")) * 100), note: String(form.get("note") || "") || undefined });
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button type="button" className="goal-add-button" disabled={goal.status === "completed"}><Plus size={14} /> {goal.status === "completed" ? "Goal complete" : "Add savings"}</button></DialogTrigger><DialogContent className="expense-dialog sm:max-w-[440px]"><DialogHeader><DialogTitle className="expense-dialog-title">Add to savings</DialogTitle><DialogDescription>Record a deposit toward this important purchase.</DialogDescription></DialogHeader><p className="contribution-goal-name">{goal.title}</p><form className="savings-form" onSubmit={submit}><label>Amount (₹)<Input name="amount" required type="number" min="1" step="1" placeholder="e.g. 2000" /></label><label>Note (optional)<Input name="note" maxLength={160} placeholder="e.g. Monthly saving" /></label><div className="savings-form-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="expense-primary" disabled={contribute.isPending}>{contribute.isPending ? "Adding…" : "Add savings"}</Button></div></form></DialogContent></Dialog>;
}

export default function SavingsGoalsPanel({ mode }: { mode: "preview" | "page" }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const goalsQuery = trpc.finance.savings.list.useQuery(undefined, { retry: false });
  const refresh = () => utils.finance.savings.list.invalidate();
  const goals = goalsQuery.data ?? [];
  const cards = goals.length === 0 ? <div className="goal-empty"><PiggyBank size={26} /><p>Start saving for something important.</p><small>Create a laptop, mobile, travel, or personal purchase goal and track each deposit.</small><GoalDialog onSaved={refresh} /></div> : goals.map((goal) => {
    const option = goalIcons[goal.icon] || goalIcons.other;
    const Icon = option.icon;
    const savedPaise = goal.savedPaise;
    const { complete, percent, remainingPaise } = getSavingsProgress(goal.targetPaise, savedPaise, goal.status);
    return <article className="savings-goal-card" key={goal.id}><div className="goal-card-top"><span className="goal-icon"><Icon size={20} /></span><div><strong>{goal.title}</strong><small>{goal.targetDate ? `Target ${format(new Date(goal.targetDate), "dd MMM yyyy")}` : "No target date"}</small></div><span className={`goal-status ${complete ? "goal-status-completed" : ""}`}>{complete ? "Complete" : "Active"}</span></div><div className="goal-amounts"><div><small>Saved</small><strong>{asCurrency(savedPaise)}</strong></div><div><small>{complete ? "Goal value" : "Left"}</small><strong>{asCurrency(complete ? goal.targetPaise : remainingPaise)}</strong></div></div><div className="goal-progress"><i style={{ width: `${percent}%` }} /></div><p className="goal-progress-copy"><span>{percent}% of {asCurrency(goal.targetPaise)}</span><span>{complete ? "Goal reached" : `${asCurrency(remainingPaise)} to go`}</span></p><ContributionDialog goal={goal} onSaved={refresh} /></article>;
  });

  if (mode === "preview") return <section className="savings-preview"><div className="savings-preview-head"><div><p className="expense-eyebrow">IMPORTANT PURCHASES</p><h2>Savings goals</h2><p className="savings-preview-copy">Set aside money for the things you plan to buy.</p></div><div className="flex gap-2"><button className="text-link" onClick={() => setLocation("/savings")}>Open savings</button><GoalDialog onSaved={refresh} /></div></div><div className="savings-goal-grid">{cards}</div></section>;
  return <section className="expense-panel savings-page-panel"><div className="expense-panel-head"><div><p className="expense-eyebrow">PURCHASE FUND</p><h2>Your savings goals</h2><p className="savings-page-lead">Choose an icon for each planned purchase, set its target, and record every saving contribution until the goal is complete.</p></div><GoalDialog onSaved={refresh} /></div>{goalsQuery.isLoading ? <div className="expense-empty"><PiggyBank size={25} /><p>Loading savings goals…</p></div> : <div className="savings-goal-grid">{cards}</div>}</section>;
}
