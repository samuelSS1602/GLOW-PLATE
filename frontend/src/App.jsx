import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { isFirebaseConfigured } from "./lib/firebase";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Today from "./pages/Today";
import AddMeal, { EditMeal } from "./pages/AddMeal";
import History from "./pages/History";
import Plan from "./pages/Plan";
import Profile from "./pages/Profile";
import SetupNotice, { LoadError } from "./pages/SetupNotice";

export default function App() {
  const { user, userData, loading, error } = useAuth();

  if (!isFirebaseConfigured) return <SetupNotice />;
  if (loading) return <div className="splash"><div className="spinner" /></div>;
  if (!user) return <Login />;
  if (error) return <LoadError error={error} />;
  if (!userData) return <div className="splash"><div className="spinner" /></div>;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="add" element={<AddMeal />} />
        <Route path="meal/:id" element={<EditMeal />} />
        <Route path="history" element={<History />} />
        <Route path="plan" element={<Plan />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
