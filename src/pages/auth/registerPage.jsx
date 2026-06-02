import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail, validatePassword } from "../../utils/validation";
import styles from "./auth.module.css";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Please enter your name.");
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

    // TODO: Replace with real API call
    localStorage.setItem("token", "fake-jwt-token");
    localStorage.setItem("userName", form.name);
    localStorage.setItem("userRole", form.role);
    setError("");
    navigate("/dashboard");
  };

  return (
    <section className={styles.container}>
      <h1>Register</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor="reg-name">Name</label>
        <input
          id="reg-name"
          className={styles.input}
          type="text"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <label htmlFor="reg-email">Email</label>
        <input
          id="reg-email"
          className={styles.input}
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <label htmlFor="reg-password">Password</label>
        <input
          id="reg-password"
          className={styles.input}
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
        />
        <label htmlFor="reg-role">Role</label>
        <select
          id="reg-role"
          className={styles.input}
          value={form.role}
          onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
        >
          <option value="student">Student / Lecturer</option>
          <option value="researcher">Researcher</option>
        </select>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>
          Create Account
        </button>
      </form>
      <p style={{ marginTop: "16px" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}

export default RegisterPage;
