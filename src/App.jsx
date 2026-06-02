import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/layout";

// Public Pages
import LandingPage from "./pages/landingPage";
import LoginPage from "./pages/auth/loginPage";
import RegisterPage from "./pages/auth/registerPage";

// User Pages
import DashboardPage from "./pages/dashboardPage";
import SearchPage from "./pages/search/searchPage";
import SearchResultsPage from "./pages/search/searchResultsPage";
import PaperDetailPage from "./pages/search/paperDetailPage";
import TrendChartPage from "./pages/trends/trendChartPage";
import BookmarksPage from "./pages/user/bookmarksPage";
import FollowingPage from "./pages/user/followingPage";
import NotificationsPage from "./pages/user/notificationsPage";

// Admin Pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/adminDashboardPage";
import AdminUserManagementPage from "./pages/admin/adminUserManagementPage";
import AdminApiConfigPage from "./pages/admin/adminApiConfigPage";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  const role = localStorage.getItem("userRole");
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const router = createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    {
      path: "/admin",
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <AdminDashboardPage /> },
        { path: "users", element: <AdminUserManagementPage /> },
        { path: "api-config", element: <AdminApiConfigPage /> },
      ],
    },
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <LandingPage /> },
        { path: "dashboard", element: <DashboardPage /> },
        {
          path: "search",
          children: [
            { index: true, element: <SearchPage /> },
            { path: "results", element: <SearchResultsPage /> },
          ],
        },
        { path: "papers/:paperId", element: <PaperDetailPage /> },
        { path: "trends", element: <TrendChartPage /> },
        { path: "bookmarks", element: <BookmarksPage /> },
        { path: "following", element: <FollowingPage /> },
        { path: "notifications", element: <NotificationsPage /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
