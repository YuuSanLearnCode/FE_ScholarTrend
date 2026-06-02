import { NavLink, Outlet, useNavigate } from "react-router-dom";

const sidebarLinks = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/api-config", label: "API Configuration" },
];

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{
        width: "240px",
        background: "#1e293b",
        color: "#fff",
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
      }}>
        <h2 style={{ padding: "0 20px", marginBottom: "24px", fontSize: "18px" }}>
          ScholarTrend Admin
        </h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              style={({ isActive }) => ({
                padding: "10px 20px",
                color: isActive ? "#60a5fa" : "#94a3b8",
                textDecoration: "none",
                background: isActive ? "#334155" : "transparent",
                borderLeft: isActive ? "3px solid #60a5fa" : "3px solid transparent",
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          style={{
            margin: "20px",
            padding: "8px 16px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </aside>
      <main style={{ flex: 1, padding: "24px", background: "#f1f5f9" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
