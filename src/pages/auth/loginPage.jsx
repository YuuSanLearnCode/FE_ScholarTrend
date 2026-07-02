import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { validateEmail, validatePassword } from "../../utils/validation";
import { googleLogin, login } from "../../services/authService";
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

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [googleToken, setGoogleToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const navigateAfterAuth = (result) => {
    const role = result?.roles?.[0]?.toLowerCase();
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

              const role = result?.roles?.[0]?.toLowerCase();
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

    try {
      const result = await login(form);
      navigateAfterAuth(result);
    } catch (err) {
      setError(getAuthErrorMessage(err, "Login failed. Please check your credentials."));
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
            <input
              id="login-password"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              required
              placeholder="........"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
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

        <p className={styles.footer}>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
