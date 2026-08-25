/**
 * Spendwise AI entry screen: secure OAuth begins only through a direct user action.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import ExpenseWorkspace from "@/components/ExpenseWorkspace";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { startLogin } from "@/const";
import { ArrowRight, Bot, ChartNoAxesCombined, Moon, ShieldCheck, Sparkles, Sun, WalletCards } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  if (isAuthenticated) return <ExpenseWorkspace />;
  return <div className="spendwise-entry"><aside className="entry-canvas"><div className="entry-grid" /><div className="entry-top"><div className="spendwise-mark"><WalletCards size={20} /><span>spend<span>wise</span></span></div><span>PERSONAL FINANCE / 01</span></div><div className="entry-copy"><p><i /> INTELLIGENT EXPENSE MANAGEMENT</p><h1>Your money,<br /><em>in clearer focus.</em></h1><span>Record expenses, set category budgets and get an AI-powered spending brief based only on the totals you authorize.</span></div><div className="entry-signal"><div><Bot size={18} /><span>AI spending brief</span></div><strong>Private by design.<br />Useful by default.</strong><p>Insights summarize your personal aggregates—not transaction notes or account credentials.</p></div><div className="entry-orbit"><i /><i /><i /><b /></div></aside><main className="entry-sheet"><header><button className="entry-theme" onClick={toggleTheme} aria-label="Toggle dark mode">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button></header><div className="entry-flow"><p className="expense-eyebrow">SECURE ACCESS</p><h2>Track less.<br /><em>Understand more.</em></h2><p>Sign in to create your private expense workspace.</p><div className="entry-features"><article><span><ChartNoAxesCombined size={18} /></span><div><strong>Financial rhythm</strong><small>See category and day-level spending patterns.</small></div></article><article><span><Sparkles size={18} /></span><div><strong>AI-aware insights</strong><small>Generate concise observations from aggregate data.</small></div></article><article><span><ShieldCheck size={18} /></span><div><strong>Your data scope</strong><small>Every record is isolated to your signed-in account.</small></div></article></div><Button onClick={() => startLogin()} className="entry-login">Sign in to Spendwise <ArrowRight size={17} /></Button><p className="entry-legal"><ShieldCheck size={14} /> Secure sign in · User-scoped financial workspace</p></div></main></div>;
}
