import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { validateEmail, validatePassword } from "../../utils/validation";
import { googleLogin, login, resendVerification } from "../../services/authService";
import styles from "./auth.module.css";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

function loadGoogleIdentityScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Sign-In."));
    document.head.appendChild(script);
  });
}

function getPrimaryAuthRole(result) {
  if (Array.isArray(result?.roles)) {
    const roles = result.roles.map(r => String(r).toLowerCase());
    if (roles.includes('admin')) return 'Admin';
    if (roles.includes('researcher')) return 'Researcher';
    return result.roles[0] || '';
  }

  return result?.roles || result?.role || "";
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  const navigateAfterAuth = (result) => {
    const role = String(getPrimaryAuthRole(result)).toLowerCase();
    navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
  };

  const getAuthErrorMessage = (err, fallback) => {
    const data = err.response?.data;
    const firstValidationError = data?.errors
      ? Object.values(data.errors).flat()[0]
      : null;
    return firstValidationError || data?.message || err.message || fallback;
  };

  useEffect(() => {
    let active = true;

    async function setupGoogleLogin() {
      if (!googleClientId || !googleButtonRef.current) {
        return;
      }

      try {
        await loadGoogleIdentityScript();
        if (!active || !window.google?.accounts?.id || !googleButtonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            if (!credential) {
              if (active) {
                setError("Google login did not return a valid credential.");
              }
              return;
            }

            if (active) {
              setGoogleLoading(true);
              setError("");
            }

            try {
              const result = await googleLogin(credential);
              if (!active) return;

              const role = String(getPrimaryAuthRole(result)).toLowerCase();
              navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
            } catch (err) {
              if (!active) return;

              setError(getAuthErrorMessage(err, "Google login failed. Please try again."));
            } finally {
              if (active) {
                setGoogleLoading(false);
              }
            }
          },
        });

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: Math.min(360, Math.max(240, googleButtonRef.current.offsetWidth || 360)),
        });
        if (active) {
          setGoogleReady(true);
        }
      } catch (err) {
        if (active) {
          setGoogleReady(false);
          setError(err.message || "Google login is currently unavailable.");
        }
      }
    }

    setupGoogleLogin();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(form.password)) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setResendSuccess("");   // Xóa thông báo xanh cũ
    setShowResend(false);   // Ẩn nút Resend cũ

    try {
      const result = await login(form);
      navigateAfterAuth(result);
    } catch (err) {
      const msg = getAuthErrorMessage(err, "Login failed. Please check your credentials.");
      setError(msg);
      // Nếu lỗi liên quan đến email chưa xác nhận → hiện nút resend
      if (msg.toLowerCase().includes("confirm your email") || msg.toLowerCase().includes("verify")) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleTokenSubmit = async (event) => {
    event.preventDefault();

    if (!googleToken.trim()) {
      setError("Please enter a Google ID token.");
      return;
    }

    setGoogleLoading(true);
    setError("");

    try {
      const result = await googleLogin(googleToken);
      navigateAfterAuth(result);
    } catch (err) {
      setError(getAuthErrorMessage(err, "Google login failed. Please try again."));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("refreshToken", "demo-refresh");
    localStorage.setItem("userRole", role);
    localStorage.setItem("userName", role === "Admin" ? "Demo Admin" : "Demo Researcher");
    localStorage.setItem("userId", "demo-user-id");
    navigate(role === "Admin" ? "/admin" : "/dashboard", { replace: true });
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.logo}>ScholarTrend</div>
        <p className={styles.subtitle}>Academic Research Intelligence</p>
        <h1 className={styles.heading}>Welcome Back</h1>
        {location.state?.message && (
          <p className={styles.success}>{location.state.message}</p>
        )}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor="login-email" className={styles.label}>Email Address</label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              placeholder="you@university.edu"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="login-password" className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="login-password"
                className={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              <button 
                type="button" 
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>
          <div style={{ textAlign: "right", marginTop: "-0.25rem" }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: "0.78rem", color: "var(--color-brand-light)", textDecoration: "none" }}
            >
              Forgot password?
            </Link>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {resendSuccess && <p className={styles.success}>{resendSuccess}</p>}
          {showResend && !resendSuccess && (
            <div style={{ marginTop: "0.25rem" }}>
              <p style={{ margin: "0 0 0.5rem", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                Didn't receive the email?
              </p>
              <button
                type="button"
                className={styles.button}
                style={{ background: "var(--color-surface)", color: "var(--color-brand)", border: "1px solid var(--color-brand-border)", marginTop: 0 }}
                disabled={resendLoading}
                onClick={async () => {
                  if (!form.email) {
                    setError("Please enter your email address first.");
                    return;
                  }
                  setResendLoading(true);
                  setError("");
                  try {
                    await resendVerification({ email: form.email });
                    setResendSuccess("Verification email sent! Please check your inbox.");
                    setShowResend(false);
                  } catch (err) {
                    setError(err.message || "Failed to resend. Please try again.");
                  } finally {
                    setResendLoading(false);
                  }
                }}
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>
          )}
          <button type="submit" className={styles.button} disabled={loading || googleLoading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.divider} aria-hidden="true">
          <span>or</span>
        </div>

        <div className={styles.googleSection}>
          {googleClientId ? (
            <>
              <div
                ref={googleButtonRef}
                className={`${styles.googleButtonHost} ${googleLoading ? styles.googleButtonBusy : ""}`}
              />
              {!googleReady && !googleLoading && (
                <p className={styles.helperText}>Preparing Google Sign-In...</p>
              )}
            </>
          ) : (
            <form className={styles.googleTokenForm} onSubmit={handleGoogleTokenSubmit}>
              <label htmlFor="google-id-token" className={styles.label}>Google ID Token</label>
              <input
                id="google-id-token"
                className={styles.input}
                type="text"
                placeholder="Paste Google idToken"
                value={googleToken}
                onChange={(e) => setGoogleToken(e.target.value)}
              />
              <button type="submit" className={styles.googleTokenButton} disabled={googleLoading || loading}>
                {googleLoading ? "Signing in with Google..." : "Sign in with Google token"}
              </button>
              <p className={styles.helperText}>
                Configure <code>VITE_GOOGLE_CLIENT_ID</code> to show the real Google button.
              </p>
            </form>
          )}
        </div>

        <div className={styles.demoSection}>
          <div className={styles.divider} aria-hidden="true"><span>or try demo</span></div>
          <div className={styles.demoButtons}>
            <button type="button" className={styles.demoBtn} onClick={() => handleDemoLogin("Researcher")}>
              Demo as Researcher
            </button>
            <button type="button" className={styles.demoBtn} onClick={() => handleDemoLogin("Admin")}>
              Demo as Admin
            </button>
          </div>
          <p className={styles.helperText}>No login required — explore all features instantly.</p>
        </div>

        <p className={styles.footer}>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
