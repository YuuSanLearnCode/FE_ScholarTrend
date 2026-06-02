import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail, validatePassword } from "../../utils/validation";
import styles from "./auth.module.css";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(form.password)) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // TODO: Replace with real API call
    // For now, fake login with localStorage
    localStorage.setItem("token", "fake-jwt-token");
    localStorage.setItem("userName", form.email.split("@")[0]);
    localStorage.setItem("userRole", "researcher");
    setError("");
    navigate("/dashboard");
  };

  return (
    <section className={styles.container}>
      <h1>Login</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          className={styles.input}
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          className={styles.input}
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>
          Sign In
        </button>
      </form>
      <p style={{ marginTop: "16px" }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}

export default LoginPage;
