import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import { ROLES } from "./utils/roles";

// Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/loginPage";
import RegisterPage from "./pages/auth/registerPage";

// User Pages
import DashboardPage from "./pages/DashboardPage";
import SearchPage from "./pages/search/searchPage";
import SearchResultsPage from "./pages/search/searchResultsPage";
import PaperDetailPage from "./pages/search/paperDetailPage";
import AuthorDetailPage from "./pages/search/authorDetailPage";
import AuthorsPage from "./pages/authors/authorsPage";
import JournalDetailPage from "./pages/journals/journalDetailPage";
import TopicDetailPage from "./pages/topics/topicDetailPage";
import TrendChartPage from "./pages/trends/trendChartPage";
import BookmarksPage from "./pages/user/bookmarksPage";
import FollowingPage from "./pages/user/followingPage";
import NotificationsPage from "./pages/user/notificationsPage";
import ProfilePage from "./pages/user/profilePage";
import PublicationReportPage from "./pages/reports/publicationReportPage";

// Admin Pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUserManagementPage from "./pages/admin/AdminUserManagementPage";
import AdminApiConfigPage from "./pages/admin/AdminApiConfigPage";

// Error Pages
import NotFoundPage from "./pages/notFoundPage";

/**
 * ProtectedRoute — chặn truy cập nếu chưa login hoặc không đúng role
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  const role = localStorage.getItem("userRole");
  const normalizedRole = role?.toLowerCase();
  const canAccess = allowedRoles.some(
    (allowedRole) => allowedRole.toLowerCase() === normalizedRole,
  );

  if (allowedRoles.length > 0 && !canAccess) {
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
        { path: "authors", element: <AuthorsPage /> },
        { path: "authors/id/:authorId", element: <AuthorDetailPage /> },
        { path: "authors/:authorName", element: <AuthorDetailPage /> },
        { path: "journals/:journalId", element: <JournalDetailPage /> },
        { path: "topics/:topicId", element: <TopicDetailPage /> },
        { path: "trends", element: <TrendChartPage /> },
        { path: "reports/publications", element: <PublicationReportPage /> },

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
