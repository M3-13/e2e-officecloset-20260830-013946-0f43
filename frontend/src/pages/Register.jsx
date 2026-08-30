import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const inputClass =
  "w-full rounded-md border border-line bg-bg px-[16px] py-[12px] min-h-[48px] text-fg placeholder-muted transition-colors duration-[160ms] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-[rgba(212,175,55,0.2)]";
const inputInvalidClass = " !border-[#C04A3A]";
const errorTextClass = "mt-1.5 text-[13px] text-[#C04A3A]";
const buttonClass =
  "w-full rounded-md bg-accent px-[24px] py-[12px] min-h-[48px] font-semibold tracking-[0.02em] text-bg transition duration-[180ms] hover:bg-[#E2C25C] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(212,175,55,0.25)] active:bg-[#B8942E] active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-accent disabled:hover:translate-y-0 disabled:hover:shadow-none";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const errors = {};
    const trimmed = email.trim();
    if (!trimmed) {
      errors.email = "Bitte gib deine E-Mail-Adresse ein.";
    } else if (!EMAIL_PATTERN.test(trimmed)) {
      errors.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
    }
    if (!password) {
      errors.password = "Bitte wähle ein Passwort.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`;
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = "Die Passwörter stimmen nicht überein.";
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setFormError(
        err?.message || "Die Registrierung ist fehlgeschlagen. Bitte versuche es erneut."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page flex justify-center">
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-md">
        <h1 className="mb-2">Registrieren</h1>
        <p className="mb-6 text-[15px] text-muted">
          Erstelle dein Konto und starte deine elegante Garderobe.
        </p>

        {formError && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-[#C04A3A] bg-[rgba(192,74,58,0.1)] px-[16px] py-[12px] text-[13px] text-[#C04A3A]"
          >
            {formError}
          </p>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="mb-1.5 block text-[14px] text-muted">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            className={inputClass + (fieldErrors.email ? inputInvalidClass : "")}
            placeholder="deine@email.de"
          />
          {fieldErrors.email && <p className={errorTextClass}>{fieldErrors.email}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="mb-1.5 block text-[14px] text-muted">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            className={inputClass + (fieldErrors.password ? inputInvalidClass : "")}
            placeholder={`Mindestens ${MIN_PASSWORD_LENGTH} Zeichen`}
          />
          {fieldErrors.password && (
            <p className={errorTextClass}>{fieldErrors.password}</p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-[14px] text-muted"
          >
            Passwort wiederholen
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            className={inputClass + (fieldErrors.confirmPassword ? inputInvalidClass : "")}
            placeholder="Passwort erneut eingeben"
          />
          {fieldErrors.confirmPassword && (
            <p className={errorTextClass}>{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Registrieren …" : "Registrieren"}
        </button>

        <p className="mt-4 text-center text-[14px] text-muted">
          Schon ein Konto?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Jetzt anmelden
          </Link>
        </p>
      </form>
    </section>
  );
}
