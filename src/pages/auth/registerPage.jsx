import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail, validatePassword } from "../../utils/validation";
import { register } from "../../services/authService";
import styles from "./auth.module.css";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    institution: "",
    researchField: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

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
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      // Handle validation errors object from BE
      if (data?.errors) {
        const firstError = Object.values(data.errors).flat()[0];
        setError(firstError || "Registration failed.");
      } else {
        setError(data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.logo}>ScholarTrend</div>
        <p className={styles.subtitle}>Academic Research Intelligence</p>
        <h1 className={styles.heading}>Create Account</h1>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor="reg-name" className={styles.label}>Full Name</label>
            <input
              id="reg-name"
              className={styles.input}
              type="text"
              placeholder="Nguyen Van A"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="reg-email" className={styles.label}>Email Address</label>
            <input
              id="reg-email"
              className={styles.input}
              type="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="reg-password" className={styles.label}>Password</label>
            <input
              id="reg-password"
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="reg-institution" className={styles.label}>Institution (optional)</label>
            <input
              id="reg-institution"
              className={styles.input}
              type="text"
              placeholder="FPT University"
              value={form.institution}
              onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="reg-field" className={styles.label}>Research Field (optional)</label>
            <input
              id="reg-field"
              className={styles.input}
              type="text"
              placeholder="Artificial Intelligence"
              value={form.researchField}
              onChange={(e) => setForm((prev) => ({ ...prev, researchField: e.target.value }))}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}

export default RegisterPage;
