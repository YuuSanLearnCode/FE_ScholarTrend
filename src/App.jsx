import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/layout";
import { ROLES } from "./utils/roles";

// Public Pages
import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/auth/loginPage";
import RegisterPage from "./pages/auth/registerPage";

// User Pages
import DashboardPage from "./pages/dashboardPage";
import SearchPage from "./pages/search/searchPage";
import SearchResultsPage from "./pages/search/searchResultsPage";
import PaperDetailPage from "./pages/search/paperDetailPage";
import AuthorDetailPage from "./pages/search/authorDetailPage";
import TrendChartPage from "./pages/trends/trendChartPage";
import BookmarksPage from "./pages/user/bookmarksPage";
import FollowingPage from "./pages/user/followingPage";
import NotificationsPage from "./pages/user/notificationsPage";
import ProfilePage from "./pages/user/profilePage";

// Admin Pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/adminDashboardPage";
import AdminUserManagementPage from "./pages/admin/adminUserManagementPage";
import AdminApiConfigPage from "./pages/admin/adminApiConfigPage";

// Error Pages
import NotFoundPage from "./pages/notFoundPage";

/**
 * ProtectedRoute — chặn truy cập nếu chưa login hoặc không đúng role
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  const role = localStorage.getItem("userRole");
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/**
 * RequireAuth — chỉ cần đăng nhập, không giới hạn role
 */
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const router = createBrowserRouter([
    // ─── Public ───
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },

    // ─── Admin (chỉ Admin) ───
    {
      path: "/admin",
      element: (
        <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <AdminDashboardPage /> },
        { path: "users", element: <AdminUserManagementPage /> },
        { path: "api-config", element: <AdminApiConfigPage /> },
      ],
    },

    // ─── Main Layout ───
    {
      path: "/",
      element: <Layout />,
      children: [
        // Public — ai cũng vào được
        { index: true, element: <LandingPage /> },
        {
          path: "search",
          children: [
            { index: true, element: <SearchPage /> },
            { path: "results", element: <SearchResultsPage /> },
          ],
        },
        { path: "papers/:paperId", element: <PaperDetailPage /> },
        { path: "authors/:authorName", element: <AuthorDetailPage /> },
        { path: "trends", element: <TrendChartPage /> },

        // Cần đăng nhập — tất cả roles
        {
          path: "dashboard",
          element: (
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          ),
        },
        {
          path: "bookmarks",
          element: (
            <RequireAuth>
              <BookmarksPage />
            </RequireAuth>
          ),
        },

        // Cần đăng nhập — tất cả roles
        {
          path: "profile",
          element: (
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          ),
        },

        // Chỉ Researcher + Admin
        {
          path: "following",
          element: (
            <ProtectedRoute allowedRoles={[ROLES.RESEARCHER, ROLES.ADMIN]}>
              <FollowingPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "notifications",
          element: (
            <ProtectedRoute allowedRoles={[ROLES.RESEARCHER, ROLES.ADMIN]}>
              <NotificationsPage />
            </ProtectedRoute>
          ),
        },

        // 404 catch-all
        { path: "*", element: <NotFoundPage /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
