import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { verifyEmail, resendVerification } from "../../services/authService";
import styles from "./auth.module.css";

// Status constants
const STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasCalled = useRef(false);

  const [status, setStatus] = useState(STATUS.LOADING);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  // resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState({ text: "", type: "" }); // type: 'success' | 'error'

  useEffect(() => {
    // Ngăn gọi API 2 lần do React StrictMode
    if (hasCalled.current) return;
    hasCalled.current = true;

    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setStatus(STATUS.ERROR);
      setMessage("Invalid verification link. Please check your email again.");
      return;
    }
    // Pre-fill email vào ô resend
    setResendEmail(email);

    async function doVerify() {
      try {
        const result = await verifyEmail({ email, token });
        setStatus(STATUS.SUCCESS);
        setMessage(
          result.message || "Your email has been verified successfully!"
        );
      } catch (err) {
        setStatus(STATUS.ERROR);
        setResendEmail(email); // đảm bảo email được điền sẵn
        setMessage(
          err.response?.data?.message ||
            err.message ||
            "Verification failed. The link may be expired or already used."
        );
      }
    }

    doVerify();
  }, [searchParams]);

  // Khi thành công, đếm ngược và tự động chuyển về trang login
  useEffect(() => {
    if (status !== STATUS.SUCCESS) return;

    if (countdown <= 0) {
      navigate("/login", {
        replace: true,
        state: { message: "Email verified! You can now sign in." },
      });
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, navigate]);

  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        {/* Logo */}
        <div className={styles.logo}>ScholarTrend</div>
        <p className={styles.subtitle}>Academic Research Intelligence</p>

        {/* Trạng thái: Đang xác thực */}
        {status === STATUS.LOADING && (
          <>
            <h1 className={styles.heading}>Verifying Email…</h1>
            <div style={loadingContainerStyle}>
              <span style={spinnerStyle} aria-label="Loading" />
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
                Please wait while we confirm your email address.
              </p>
            </div>
          </>
        )}

        {/* Trạng thái: Thành công */}
        {status === STATUS.SUCCESS && (
          <>
            <h1 className={styles.heading}>Email Verified!</h1>
            <div style={iconWrapperStyle("#f0fdf4", "#16a34a")}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="#dcfce7" />
                <path
                  d="M7 12.5l3.5 3.5 6.5-7"
                  stroke="#16a34a"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className={styles.success}>{message}</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "1rem" }}>
              Redirecting to login in{" "}
              <strong style={{ color: "var(--color-brand)" }}>{countdown}</strong>s…
            </p>
            <p className={styles.footer}>
              <Link to="/login">Go to Login now →</Link>
            </p>
          </>
        )}

        {/* Trạng thái: Lỗi */}
        {status === STATUS.ERROR && (
          <>
            <h1 className={styles.heading}>Verification Failed</h1>
            <div style={iconWrapperStyle("#fef2f2", "#dc2626")}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="#fee2e2" />
                <path
                  d="M8 8l8 8M16 8l-8 8"
                  stroke="#dc2626"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className={styles.error}>{message}</p>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.85rem",
                marginTop: "1rem",
              }}
            >
              The link may have expired or already been used.
            </p>

            {/* Form gửi lại email */}
            <div style={{ marginTop: "1.25rem", textAlign: "left" }}>
              <p style={{ margin: "0 0 0.5rem", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>
                Resend verification email
              </p>
              <div className={styles.fieldGroup}>
                <label htmlFor="resend-email" className={styles.label}>Your Email</label>
                <input
                  id="resend-email"
                  type="email"
                  className={styles.input}
                  placeholder="you@university.edu"
                  value={resendEmail}
                  onChange={(e) => { setResendEmail(e.target.value); setResendMsg({ text: "", type: "" }); }}
                />
              </div>
              {resendMsg.text && (
                <p className={resendMsg.type === "success" ? styles.success : styles.error}
                  style={{ marginTop: "0.5rem" }}>
                  {resendMsg.text}
                </p>
              )}
              <button
                type="button"
                className={styles.button}
                style={{ marginTop: "0.75rem", background: "var(--color-surface)", color: "var(--color-brand)", border: "1px solid var(--color-brand-border)" }}
                disabled={resendLoading}
                onClick={async () => {
                  if (!resendEmail.trim()) {
                    setResendMsg({ text: "Please enter your email address.", type: "error" });
                    return;
                  }
                  setResendLoading(true);
                  setResendMsg({ text: "", type: "" });
                  try {
                    await resendVerification({ email: resendEmail });
                    setResendMsg({ text: "Verification email sent! Check your inbox.", type: "success" });
                  } catch (err) {
                    setResendMsg({ text: err.message || "Failed to resend. Please try again.", type: "error" });
                  } finally {
                    setResendLoading(false);
                  }
                }}
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>

            <p className={styles.footer} style={{ marginTop: "1.25rem" }}>
              <Link to="/register">Back to Register</Link>
              {" · "}
              <Link to="/login">Sign In</Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}

// ── Inline styles nhỏ để tránh thêm class vào CSS ──
const loadingContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1.25rem",
  padding: "1.5rem 0",
};

const spinnerStyle = {
  display: "block",
  width: "44px",
  height: "44px",
  border: "4px solid var(--color-border)",
  borderTop: "4px solid var(--color-brand)",
  borderRadius: "50%",
  animation: "spin 0.9s linear infinite",
};

function iconWrapperStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    margin: "1rem 0 0.5rem",
  };
}

// Thêm keyframe spin nếu chưa có trong global CSS
if (typeof document !== "undefined") {
  const styleId = "verify-spin-keyframe";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
}

export default VerifyEmailPage;
