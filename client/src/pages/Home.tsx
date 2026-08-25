/**
 * Clinical Editorial Protocol: an asymmetric hospital access briefing with a care-signal
 * canvas, numbered stages, custom role contexts, and a low-glare dark mode.
 */
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardPlus,
  Eye,
  EyeOff,
  HeartPulse,
  KeyRound,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Role = "Receptionist" | "Hospital Manager";

const roles: Array<{
  name: Role;
  eyebrow: string;
  description: string;
  insight: string;
  icon: typeof ClipboardPlus;
}> = [
  {
    name: "Receptionist",
    eyebrow: "FRONT DESK",
    description: "Manage arrivals, appointments and patient flow with clarity.",
    insight: "Your front-desk board will be ready on entry.",
    icon: ClipboardPlus,
  },
  {
    name: "Hospital Manager",
    eyebrow: "OPERATIONS",
    description: "Review staffing, operations and care-performance signals.",
    insight: "Your operations briefing will be ready on entry.",
    icon: UserCog,
  },
];

export default function Home() {
  const [role, setRole] = useState<Role>("Receptionist");
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const selectedRole = roles.find((item) => item.name === role) ?? roles[0];

  useEffect(() => {
    setIsDark(window.sessionStorage.getItem("medora-theme") === "dark");
  }, []);

  const changeTheme = () => {
    setIsDark((current) => {
      const next = !current;
      window.sessionStorage.setItem("medora-theme", next ? "dark" : "light");
      return next;
    });
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your work email to continue.");
      return;
    }
    toast.success(`${role} access confirmed. Taking you to your workspace.`);
  };

  return (
    <div className={`protocol-portal ${isDark ? "protocol-dark" : ""}`}>
      <aside className="care-canvas">
        <div className="canvas-rule canvas-rule-one" />
        <div className="canvas-rule canvas-rule-two" />
        <div className="canvas-orbit"><i /><i /><i /><b /></div>

        <div className="canvas-top">
          <div className="medora-lockup">
            <span className="medora-mark"><HeartPulse size={19} strokeWidth={2.5} /></span>
            <span className="medora-wordmark">medora<span>care</span></span>
          </div>
          <span className="system-id">SYSTEM / 01</span>
        </div>

        <div className="canvas-story">
          <p className="signal-label"><span /> ACCESS PROTOCOL</p>
          <h1>A better start<br />to every care shift.</h1>
          <p className="canvas-description">A focused entry point for the people who keep care moving: one clear signal, then the right workspace.</p>
        </div>

        <div className="care-status-card">
          <div className="status-card-top"><span className="pulse-dot" /><p>Clinical system status</p><span className="status-ready">READY</span></div>
          <div className="status-reading"><strong>All systems<br />calm.</strong><span className="reading-index">01<span>/ 01</span></span></div>
          <div className="status-lines"><span /><span /><span /><span /><span /><span /><span /></div>
          <p className="status-copy">A quiet, secure handoff into your role-specific workspace.</p>
        </div>

        <div className="canvas-bottom"><span>MEDORA CARE SYSTEMS</span><span>ACCESS LAYER</span></div>
      </aside>

      <main className="access-sheet">
        <header className="sheet-topbar">
          <div className="mobile-brand medora-lockup"><span className="medora-mark"><HeartPulse size={17} strokeWidth={2.5} /></span><span className="medora-wordmark">medora<span>care</span></span></div>
          <div className="security-chip"><ShieldCheck size={14} /> Private access</div>
          <button type="button" onClick={changeTheme} className="mode-button" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            <span className={!isDark ? "mode-active" : ""}><Sun size={14} /></span>
            <span className={isDark ? "mode-active" : ""}><Moon size={14} /></span>
          </button>
        </header>

        <div className="sheet-flow">
          <div className="sheet-heading">
            <div className="heading-index"><span>ACCESS</span><b>01</b></div>
            <div><p className="sheet-overline">GOOD TO SEE YOU</p><h2>Enter with<br /><em>clarity.</em></h2></div>
            <p>Three short steps, then your care workspace is ready.</p>
          </div>

          <section className="protocol-section role-stage" aria-labelledby="role-title">
            <div className="section-meta"><span>01</span><div><p>IDENTIFY YOUR ROLE</p><small id="role-title">Select the workspace that fits your responsibility.</small></div></div>
            <div className="role-tiles">
              {roles.map(({ name, eyebrow, description, icon: Icon }) => (
                <button type="button" key={name} onClick={() => setRole(name)} className={`role-tile ${role === name ? "role-tile-selected" : ""}`} aria-pressed={role === name}>
                  <span className="tile-icon"><Icon size={18} /></span>
                  <span className="tile-content"><small>{eyebrow}</small><strong>{name}</strong><em>{description}</em></span>
                  <span className="tile-check">{role === name ? <Check size={14} strokeWidth={3} /> : <i />}</span>
                </button>
              ))}
            </div>
          </section>

          <form onSubmit={submitLogin}>
            <section className="protocol-section auth-stage" aria-labelledby="auth-title">
              <div className="section-meta"><span>02</span><div><p>CONFIRM YOUR ACCESS</p><small id="auth-title">Your account is protected with a secure hospital session.</small></div></div>
              <div className="field-stack">
                <label className="protocol-label" htmlFor="work-email">Work email<Input id="work-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="name@hospital.com" className="protocol-input" /></label>
                <div className="password-label-row"><label className="protocol-label" htmlFor="password">Password</label><button type="button" onClick={() => toast.info("Password reset instructions will be sent to your work email.")} className="quiet-link">Reset password</button></div>
                <div className="password-wrap"><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="protocol-input pr-12" /><button type="button" className="password-eye" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              </div>
            </section>

            <section className="protocol-section entry-stage" aria-labelledby="entry-title">
              <div className="section-meta section-meta-compact"><span>03</span><div><p id="entry-title">ENTER YOUR WORKSPACE</p><small>{selectedRole.insight}</small></div></div>
              <div className="entry-actions"><Button type="submit" className="protocol-submit">Continue as {role} <ArrowRight size={17} /></Button><button type="button" onClick={() => toast.info("Single sign-on will redirect you to your hospital identity provider.")} className="sso-control"><KeyRound size={15} /> Use hospital SSO <ChevronRight size={15} /></button></div>
            </section>
          </form>

          <div className="ai-margin-note"><span><Sparkles size={15} /></span><p><strong>Quiet by design.</strong> This access flow keeps only the decisions you need before your shift begins.</p></div>
        </div>

        <footer className="sheet-footer"><span><LockKeyhole size={13} /> Encrypted session & role-based workspace</span><div><button type="button" onClick={() => toast.info("Contact your hospital manager for an invitation.")}>Need access?</button><i /> <button type="button" onClick={() => toast.info("Support is available 24/7 for hospital teams.")}>Support</button></div></footer>
      </main>
    </div>
  );
}
