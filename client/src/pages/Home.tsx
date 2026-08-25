/**
 * Hospital login design reminder: clinical confidence, quiet navy structure, warm white
 * surfaces, teal status signals, and clear role-based access without decorative imagery.
 */
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardPlus,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Stethoscope,
  Sun,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Role = "Receptionist" | "Hospital Manager";

const roles: Array<{ name: Role; description: string; icon: typeof ClipboardPlus }> = [
  { name: "Receptionist", description: "Appointments, patient check-in and daily front-desk tasks.", icon: ClipboardPlus },
  { name: "Hospital Manager", description: "Operations, staff overview and performance reporting.", icon: UserCog },
];

export default function Home() {
  const [role, setRole] = useState<Role>("Receptionist");
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const savedTheme = window.sessionStorage.getItem("medora-theme");
    setIsDark(savedTheme === "dark");
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
    toast.success(`${role} portal verified. Your secure workspace is ready.`);
  };

  return (
    <div className={`hospital-shell ${isDark ? "hospital-dark" : ""}`}>
      <section className="hospital-intro">
        <div className="hospital-intro-grid" />
        <div className="hospital-intro-content">
          <div className="brand-lockup">
            <span className="brand-symbol"><HeartPulse size={22} strokeWidth={2.4} /></span>
            <span className="brand-name">Medora<span>Care</span></span>
          </div>

          <div className="intro-copy">
            <p className="intro-kicker"><span /> HOSPITAL OPERATING SYSTEM</p>
            <h1>Care that moves<br />with clarity.</h1>
            <p className="intro-description">One protected workspace for your front desk, hospital operations and every moment of patient care in between.</p>
          </div>

          <div className="intro-features">
            <div className="intro-feature"><span><ShieldCheck size={18} /></span><div><p>Protected by design</p><small>Role-based access and secure sessions</small></div></div>
            <div className="intro-feature"><span><Stethoscope size={18} /></span><div><p>Built for every shift</p><small>Focused workflows for hospital teams</small></div></div>
          </div>
        </div>
        <div className="intro-footer"><span>MEDORA CARE SYSTEMS</span><span>© 2026</span></div>
      </section>

      <main className="login-stage">
        <header className="login-header">
          <div className="brand-lockup brand-mobile">
            <span className="brand-symbol"><HeartPulse size={19} strokeWidth={2.4} /></span>
            <span className="brand-name">Medora<span>Care</span></span>
          </div>
          <button type="button" className="theme-switch" onClick={changeTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            <span className={!isDark ? "theme-switch-active" : ""}><Sun size={15} /></span>
            <span className={isDark ? "theme-switch-active" : ""}><Moon size={15} /></span>
          </button>
        </header>

        <div className="login-frame">
          <div className="login-heading">
            <p className="overline">SECURE ACCESS</p>
            <h2>Welcome back.</h2>
            <p>Choose your workspace, then sign in to continue your shift.</p>
          </div>

          <div className="role-picker" aria-label="Choose your workspace">
            {roles.map(({ name, description, icon: Icon }) => (
              <button
                type="button"
                key={name}
                className={`role-option ${role === name ? "role-option-active" : ""}`}
                onClick={() => setRole(name)}
                aria-pressed={role === name}
              >
                <span className="role-icon"><Icon size={19} strokeWidth={2} /></span>
                <span className="role-copy"><strong>{name}</strong><small>{description}</small></span>
                <span className="role-radio">{role === name && <CheckCircle2 size={16} />}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submitLogin} className="login-form">
            <label className="field-label" htmlFor="work-email">Work email</label>
            <Input
              id="work-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@hospital.com"
              type="email"
              autoComplete="email"
              className="hospital-input"
            />

            <div className="mt-5 flex items-center justify-between gap-3">
              <label className="field-label !mb-0" htmlFor="password">Password</label>
              <button type="button" onClick={() => toast.info("Password reset instructions will be sent to your work email.")} className="text-button">Forgot password?</button>
            </div>
            <div className="password-field">
              <Input id="password" placeholder="Enter your password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="hospital-input pr-12" />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>

            <div className="signin-row">
              <label className="remember-check"><input type="checkbox" defaultChecked /><span />Remember this device</label>
              <span className="signin-role">Signing in as <strong>{role}</strong></span>
            </div>

            <Button type="submit" className="signin-button">
              Sign in to workspace <ArrowRight size={18} />
            </Button>
          </form>

          <div className="or-divider"><span>OR</span></div>
          <button type="button" className="sso-button" onClick={() => toast.info("Single sign-on will redirect you to your organization provider.")}><LockKeyhole size={16} /> Continue with hospital SSO <ChevronRight size={16} /></button>

          <p className="access-note"><ShieldCheck size={15} /> This is a restricted healthcare workspace. Unauthorized access is monitored.</p>
        </div>

        <footer className="login-footer"><span>Need access? <button type="button" onClick={() => toast.info("Contact your hospital manager for a workspace invitation.")}>Contact your manager</button></span><a href="#support" onClick={(event) => { event.preventDefault(); toast.info("Support is available 24/7 for hospital teams."); }}>System support</a></footer>
      </main>
    </div>
  );
}
