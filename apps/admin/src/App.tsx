import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './store';
import Login from './pages/Login';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import WorkerDetail from './pages/WorkerDetail';
import Dispatch from './pages/Dispatch';
import Orders from './pages/Orders';
import Categories from './pages/Categories';
import AdminUsers from './pages/AdminUsers';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuth((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="workers" element={<Workers />} />
        <Route path="workers/:id" element={<WorkerDetail />} />
        <Route path="dispatch" element={<Dispatch />} />
        <Route path="orders" element={<Orders />} />
        <Route path="categories" element={<Categories />} />
        <Route path="admins" element={<AdminUsers />} />
      </Route>
    </Routes>
  );
}
