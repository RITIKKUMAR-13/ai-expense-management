/**
 * Spendwise AI workspace: an authenticated, user-scoped expense system. Charts reflect
 * stored expense data only; AI receives aggregates, never raw notes, merchant details, or identifiers.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot, CalendarDays, ChevronRight, CircleDollarSign, Coffee, CreditCard, IndianRupee, Moon, PieChart as PieChartIcon, Plus, ReceiptText, ShoppingBag, Sparkles, Sun, Target, Trash2, TrendingDown, UtensilsCrossed, WalletCards } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const categoryMeta: Record<string, { label: string; color: string; icon: typeof UtensilsCrossed }> = {
  food: { label: "Food & dining", color: "#0d8178", icon: UtensilsCrossed },
  transport: { label: "Transport", color: "#6b72c9", icon: CircleDollarSign },
  shopping: { label: "Shopping", color: "#dd7f5f", icon: ShoppingBag },
  bills: { label: "Bills & utilities", color: "#e1ab3e", icon: ReceiptText },
  health: { label: "Health", color: "#c75f82", icon: CircleDollarSign },
  entertainment: { label: "Entertainment", color: "#8c6ac0", icon: Coffee },
  other: { label: "Other", color: "#829490", icon: CreditCard },
};

const categoryOptions = Object.entries(categoryMeta);
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const asCurrency = (paise: number) => currency.format(paise / 100);
const nowPeriodKey = () => format(new Date(), "yyyy-MM");

function ExpenseDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const create = trpc.finance.expenses.create.useMutation({
    onSuccess: () => { onCreated(); setOpen(false); toast.success("Expense added to your private ledger."); },
    onError: (error) => toast.error(error.message),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Math.round(Number(form.get("amount")) * 100);
    create.mutate({
      merchant: String(form.get("merchant") || ""),
      category: String(form.get("category")) as "food" | "transport" | "shopping" | "bills" | "health" | "entertainment" | "other",
      amountPaise: amount,
      spentAt: new Date(String(form.get("spentAt"))),
      paymentMethod: String(form.get("paymentMethod") || "") || undefined,
      note: String(form.get("note") || "") || undefined,
    });
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button className="expense-primary"><Plus size={16} /> Add expense</Button></DialogTrigger>
    <DialogContent className="expense-dialog sm:max-w-[500px]"><DialogHeader><DialogTitle className="expense-dialog-title">Log an expense</DialogTitle><DialogDescription>Amounts are saved to your private ledger. Add only information you are comfortable tracking.</DialogDescription></DialogHeader>
      <form className="expense-form" onSubmit={submit}>
        <label>Merchant or title<Input name="merchant" required placeholder="e.g. Grocery store" /></label>
        <div className="expense-form-grid"><label>Amount (₹)<Input name="amount" required type="number" min="0.01" step="0.01" placeholder="0.00" /></label><label>Category<select name="category" defaultValue="food">{categoryOptions.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}</select></label></div>
        <div className="expense-form-grid"><label>Date & time<Input name="spentAt" required type="datetime-local" defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")} /></label><label>Payment method<select name="paymentMethod" defaultValue="UPI"><option>UPI</option><option>Credit card</option><option>Debit card</option><option>Cash</option><option>Bank transfer</option></select></label></div>
        <label>Note (optional)<Input name="note" maxLength={240} placeholder="A short reminder for this expense" /></label>
        <div className="expense-form-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="expense-primary" disabled={create.isPending}>{create.isPending ? "Saving…" : "Save expense"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

function BudgetDialog({ periodKey, onSaved }: { periodKey: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const setBudget = trpc.finance.budgets.set.useMutation({
    onSuccess: () => { onSaved(); setOpen(false); toast.success("Budget saved for this month."); },
    onError: (error) => toast.error(error.message),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBudget.mutate({ category: String(form.get("category")) as "food" | "transport" | "shopping" | "bills" | "health" | "entertainment" | "other", periodKey, limitPaise: Math.round(Number(form.get("limit")) * 100) });
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button className="expense-secondary"><Target size={16} /> Set budget</Button></DialogTrigger>
    <DialogContent className="expense-dialog sm:max-w-[460px]"><DialogHeader><DialogTitle className="expense-dialog-title">Set a category budget</DialogTitle><DialogDescription>A budget is a personal tracking threshold, not financial advice.</DialogDescription></DialogHeader>
      <form className="expense-form" onSubmit={submit}><label>Category<select name="category" defaultValue="food">{categoryOptions.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}</select></label><label>Monthly limit (₹)<Input name="limit" required type="number" min="1" step="1" placeholder="e.g. 8000" /></label><div className="expense-form-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="expense-primary" disabled={setBudget.isPending}>{setBudget.isPending ? "Saving…" : "Save budget"}</Button></div></form>
    </DialogContent>
  </Dialog>;
}

function StatCard({ icon: Icon, label, value, note, accent = "teal" }: { icon: typeof WalletCards; label: string; value: string; note: string; accent?: string }) {
  return <article className={`expense-stat expense-stat-${accent}`}><span className="expense-stat-icon"><Icon size={18} /></span><p>{label}</p><strong>{value}</strong><small>{note}</small></article>;
}

export default function ExpenseWorkspace() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [periodKey, setPeriodKey] = useState(nowPeriodKey);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const utils = trpc.useUtils();
  const dashboard = trpc.finance.dashboard.useQuery({ periodKey }, { retry: false });
  const insight = trpc.finance.insight.useMutation({ onError: (error) => toast.error(error.message) });
  const deleteExpense = trpc.finance.expenses.delete.useMutation({ onSuccess: () => { utils.finance.dashboard.invalidate({ periodKey }); toast.success("Expense removed from your ledger."); }, onError: (error) => toast.error(error.message) });
  const page = typeof window === "undefined" ? "/" : window.location.pathname;
  const data = dashboard.data;
  const expenses = data?.expenses ?? [];
  const budgets = data?.budgets ?? [];
  const refresh = () => utils.finance.dashboard.invalidate({ periodKey });
  const titleMap: Record<string, { eyebrow: string; title: string; copy: string }> = {
    "/": { eyebrow: "SPENDWISE OVERVIEW", title: `Good day, ${user?.name?.split(" ")[0] || "there"}.`, copy: "See where your money is going and keep your spending pace in focus." },
    "/expenses": { eyebrow: "PRIVATE LEDGER", title: "Every expense, in context.", copy: "Track, filter, and remove personal expense records in your private workspace." },
    "/budgets": { eyebrow: "BUDGET STUDIO", title: "Plan category by category.", copy: "Set flexible monthly category thresholds and compare them with current spending." },
    "/insights": { eyebrow: "AI EXPENSE BRIEF", title: "A clearer next move.", copy: "Generate a short observation from your selected month’s aggregate spending totals." },
  };
  const pageInfo = titleMap[page] ?? titleMap["/"];
  const filteredExpenses = expenses.filter((expense) => categoryFilter === "all" || expense.category === categoryFilter);
  const categoryData = data?.categoryTotals.map((item) => ({ name: categoryMeta[item.category]?.label || item.category, value: item.amountPaise / 100, color: categoryMeta[item.category]?.color || "#829490" })) ?? [];
  const chartData = Object.values(expenses.reduce<Record<string, number>>((result, expense) => { const day = format(new Date(expense.spentAt), "dd"); result[day] = (result[day] || 0) + expense.amountPaise / 100; return result; }, {})).length
    ? Object.entries(expenses.reduce<Record<string, number>>((result, expense) => { const day = format(new Date(expense.spentAt), "dd"); result[day] = (result[day] || 0) + expense.amountPaise / 100; return result; }, {})).map(([day, amount]) => ({ day, amount })) : [];
  const generateInsight = () => {
    if (expenses.length === 0) return toast.info("Add at least one expense before generating an AI insight.");
    insight.mutate({ periodKey });
  };
  const renderTransactions = () => <div className="expense-transactions">{filteredExpenses.length === 0 ? <div className="expense-empty"><ReceiptText size={25} /><p>No expenses match this view.</p><small>Add an expense or choose another category.</small></div> : filteredExpenses.map((expense) => { const meta = categoryMeta[expense.category]; const Icon = meta?.icon || CreditCard; return <div className="expense-row" key={expense.id}><span className="expense-row-icon" style={{ background: `${meta?.color || "#829490"}18`, color: meta?.color || "#829490" }}><Icon size={17} /></span><div className="expense-row-main"><strong>{expense.merchant}</strong><span>{meta?.label || expense.category} · {format(new Date(expense.spentAt), "dd MMM, hh:mm a")}</span></div><div className="expense-row-value"><strong>{asCurrency(expense.amountPaise)}</strong><span>{expense.paymentMethod || "Personal"}</span></div><button className="delete-expense" onClick={() => deleteExpense.mutate({ id: expense.id })} aria-label={`Delete ${expense.merchant}`}><Trash2 size={16} /></button></div>; })}</div>;
  const renderBudgets = () => <div className="budget-stack">{budgets.length === 0 ? <div className="expense-empty"><Target size={25} /><p>No budgets set for this month.</p><small>Create a category budget to monitor spending pace.</small></div> : budgets.map((budget) => {
    const meta = categoryMeta[budget.category];
    const remainingPaise = budget.limitPaise - budget.spentPaise;
    const percent = Math.round((budget.spentPaise / budget.limitPaise) * 100);
    const displayPercent = Math.min(100, percent);
    const isOverBudget = remainingPaise < 0;
    return <article className={`budget-item ${isOverBudget ? "budget-over" : ""}`} key={budget.id}>
      <div className="budget-item-head"><span><i style={{ background: meta?.color }} />{meta?.label || budget.category}</span><strong>{percent}% used</strong></div>
      <div className="budget-figures"><div><small>Budget</small><strong>{asCurrency(budget.limitPaise)}</strong></div><div><small>Spent</small><strong>{asCurrency(budget.spentPaise)}</strong></div><div className="budget-left"><small>{isOverBudget ? "Over by" : "Left"}</small><strong>{asCurrency(Math.abs(remainingPaise))}</strong></div></div>
      <div className="budget-bar"><i style={{ width: `${displayPercent}%`, background: isOverBudget ? "#d2635e" : meta?.color }} /></div>
      <p>{isOverBudget ? "This category is over its monthly plan." : "You still have this amount available in the category."}</p>
    </article>;
  })}</div>;

  if (dashboard.isLoading) return <div className="expense-loading"><div className="expense-loading-mark"><WalletCards size={21} /></div><p>Spendwise AI · Financial Studio</p><strong>Preparing your monthly<br />money review.</strong><span>Loading your private expense records…</span><i /></div>;
  if (dashboard.error) return <div className="expense-loading"><p>We could not load your expense workspace.</p><Button className="expense-primary" onClick={() => dashboard.refetch()}>Try again</Button></div>;

  return <DashboardLayout><div className="expense-workspace">
    <header className="expense-top"><div><p className="expense-eyebrow">{pageInfo.eyebrow}</p><h1>{pageInfo.title}</h1><p className="expense-lead">{pageInfo.copy}</p></div><div className="expense-tools"><label className="period-picker"><CalendarDays size={15} /><input type="month" value={periodKey} onChange={(event) => setPeriodKey(event.target.value)} /></label><button className="expense-theme" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}<span>{theme === "dark" ? "Light" : "Dark"}</span></button><ExpenseDialog onCreated={refresh} /></div></header>
    {page === "/" && <>
      <section className="expense-stat-grid"><StatCard icon={WalletCards} label="Total spent" value={asCurrency(data?.stats.totalSpentPaise ?? 0)} note={`${data?.stats.transactionCount ?? 0} recorded transactions`} /><StatCard icon={Target} label="Budget remaining" value={asCurrency(data?.stats.remainingBudgetPaise ?? 0)} note={data?.stats.totalBudgetPaise ? `of ${asCurrency(data.stats.totalBudgetPaise)} planned` : "Set a budget to track pace"} accent="lime" /><StatCard icon={PieChartIcon} label="Top category" value={categoryData[0]?.name || "—"} note={categoryData[0] ? asCurrency(Math.round(categoryData[0].value * 100)) : "Add an expense to see it"} accent="coral" /><StatCard icon={Sparkles} label="AI readiness" value={expenses.length ? "Ready" : "Waiting"} note={expenses.length ? "Aggregate insight available" : "Needs one expense"} accent="violet" /></section>
      <section className="expense-main-grid"><article className="expense-panel expense-chart-panel"><div className="expense-panel-head"><div><p className="expense-eyebrow">SPENDING PACE</p><h2>Daily expense rhythm</h2></div><span>{format(new Date(`${periodKey}-01T00:00:00`), "MMMM yyyy")}</span></div>{chartData.length ? <div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 8, left: -28, bottom: 0 }}><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0d8178" stopOpacity={.3} /><stop offset="100%" stopColor="#0d8178" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#7f9591" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#7f9591" }} tickFormatter={(value) => `₹${value}`} /><Tooltip formatter={(value: number) => asCurrency(Math.round(value * 100))} /><Area type="monotone" dataKey="amount" stroke="#0d8178" strokeWidth={3} fill="url(#areaFill)" /></AreaChart></ResponsiveContainer></div> : <div className="chart-empty"><TrendingDown size={25} /><p>Your spending rhythm will appear here.</p><small>Log your first expense to begin.</small></div>}</article>
        <article className="expense-ai-card"><div className="ai-card-top"><span><Bot size={17} /></span><p>SPENDWISE AI</p></div><h2>{insight.data?.headline || "Ask for a monthly spending brief."}</h2><p>{insight.data?.observation || "Generate a concise observation from your aggregate expense and budget totals. No transaction notes or merchant details are shared with the AI insight."}</p>{insight.data && <div className="ai-next"><strong>Next focus</strong><span>{insight.data.nextStep}</span></div>}<Button onClick={generateInsight} disabled={insight.isPending} className="ai-generate">{insight.isPending ? "Analyzing aggregates…" : insight.data ? "Refresh AI brief" : "Generate AI brief"}<ChevronRight size={16} /></Button></article>
      </section>
      <section className="expense-bottom-grid"><article className="expense-panel"><div className="expense-panel-head"><div><p className="expense-eyebrow">RECENT ACTIVITY</p><h2>Ledger entries</h2></div><button className="text-link" onClick={() => setLocation("/expenses")}>Open ledger <ChevronRight size={15} /></button></div>{renderTransactions()}</article><article className="expense-panel budget-ledger-panel"><div className="expense-panel-head"><div><p className="expense-eyebrow">BUDGET LEFT</p><h2>Category balances</h2></div><button className="text-link" onClick={() => setLocation("/budgets")}>Manage budgets <ChevronRight size={15} /></button></div><div className="budget-column-head"><span>Category</span><span>Budget</span><span>Spent</span><span>Left</span></div>{renderBudgets()}</article></section>
    </>}
    {page === "/expenses" && <section className="expense-panel ledger-panel"><div className="expense-panel-head"><div><p className="expense-eyebrow">TRANSACTION HISTORY</p><h2>Private expense ledger</h2></div><ExpenseDialog onCreated={refresh} /></div><div className="category-filter"><button className={categoryFilter === "all" ? "filter-active" : ""} onClick={() => setCategoryFilter("all")}>All</button>{categoryOptions.map(([key, meta]) => <button key={key} className={categoryFilter === key ? "filter-active" : ""} onClick={() => setCategoryFilter(key)}>{meta.label}</button>)}</div>{renderTransactions()}</section>}
    {page === "/budgets" && <section className="expense-panel ledger-panel budget-studio-panel"><div className="expense-panel-head"><div><p className="expense-eyebrow">MONTHLY THRESHOLDS</p><h2>Budget studio</h2><p className="budget-summary-copy">Each category shows what you planned, what you spent, and the exact amount left to use.</p></div><BudgetDialog periodKey={periodKey} onSaved={refresh} /></div><div className="budget-column-head budget-column-head-wide"><span>Category</span><span>Budget</span><span>Spent</span><span>Remaining</span></div><div className="budget-main">{renderBudgets()}</div></section>}
    {page === "/insights" && <section className="insights-layout"><article className="insight-hero"><p className="expense-eyebrow">AI EXPENSE BRIEF</p><h2>Less noise.<br /><em>More focus.</em></h2><p>Spendwise AI analyzes only the current month’s category totals, budgets and transaction count to create a concise descriptive brief.</p><Button onClick={generateInsight} disabled={insight.isPending} className="ai-generate">{insight.isPending ? "Analyzing aggregates…" : "Generate AI brief"}<Sparkles size={16} /></Button></article><article className="expense-panel insight-result"><p className="expense-eyebrow">YOUR CURRENT BRIEF</p>{insight.data ? <><h2>{insight.data.headline}</h2><p>{insight.data.observation}</p><div><strong>Focus category</strong><span>{categoryMeta[insight.data.focusCategory]?.label || insight.data.focusCategory}</span></div><div><strong>Next step</strong><span>{insight.data.nextStep}</span></div></> : <div className="expense-empty"><Bot size={25} /><p>No AI brief yet.</p><small>Generate one after adding expense data for the selected month.</small></div>}</article><article className="expense-panel category-chart"><div className="expense-panel-head"><div><p className="expense-eyebrow">CATEGORY MIX</p><h2>Where the month is going</h2></div></div>{categoryData.length ? <div className="pie-layout"><div className="pie-frame"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={4} stroke="none">{categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer></div><div>{categoryData.map((item) => <p key={item.name}><i style={{ background: item.color }} />{item.name}<strong>{asCurrency(Math.round(item.value * 100))}</strong></p>)}</div></div> : <div className="expense-empty"><PieChartIcon size={25} /><p>Category mix appears after expenses are added.</p></div>}</article></section>}
  </div></DashboardLayout>;
}
