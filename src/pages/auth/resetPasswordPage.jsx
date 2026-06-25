import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import styles from "./auth.module.css";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // BE gửi link dạng: /reset-password?email=xxx&token=yyy
  const emailFromUrl = searchParams.get("email") || "";
  const tokenFromUrl = searchParams.get("token") || "";

  const [form, setForm] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Nếu không có token hoặc email trong URL thì báo lỗi link không hợp lệ
  const isValidLink = emailFromUrl && tokenFromUrl;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword({
        email: emailFromUrl,
        token: tokenFromUrl,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      });
      // Thành công → chuyển về login kèm thông báo
      navigate("/login", {
        replace: true,
        state: { message: "Password reset successfully! Please sign in with your new password." },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reset password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  // Link không hợp lệ
  if (!isValidLink) {
    return (
      <div className={styles.wrapper}>
        <section className={styles.container}>
          <div className={styles.logo}>ScholarTrend</div>
          <p className={styles.subtitle}>Academic Research Intelligence</p>
          <div className={styles.errorBox}>
            <h1 className={styles.heading}>Invalid reset link</h1>
            <p className={styles.hintText}>
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <p className={styles.footer}>
            <Link to="/forgot-password">Request new reset link</Link>
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.logo}>ScholarTrend</div>
        <p className={styles.subtitle}>Academic Research Intelligence</p>
        <h1 className={styles.heading}>Set new password</h1>
        <p className={styles.hintText}>
          Enter a new password for <strong>{emailFromUrl}</strong>.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor="reset-new-password" className={styles.label}>
              New Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="reset-new-password"
                className={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={form.newPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                autoComplete="new-password"
                autoFocus
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

          <div className={styles.fieldGroup}>
            <label htmlFor="reset-confirm-password" className={styles.label}>
              Confirm New Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="reset-confirm-password"
                className={styles.input}
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat new password"
                value={form.confirmNewPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex="-1"
              >
                {showConfirm ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to="/login">← Back to Sign in</Link>
        </p>
      </section>
    </div>
  );
}

export default ResetPasswordPage;
