import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout    from './components/Layout/Layout';
import Home      from './pages/Home';
import Sobre     from './pages/Sobre';
import Contato   from './pages/Contato';
import Login     from './pages/Login';
import Perfil    from './pages/Perfil';
import Submeter  from './pages/Submeter';
import Post      from './pages/Post';
import Termos    from './pages/Termos';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import SpotList  from './pages/admin/SpotList';
import SpotForm  from './pages/admin/SpotForm';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas com header/drawer */}
        <Route element={<Layout />}>
          <Route path="/"         element={<Home />} />
          <Route path="/sobre"    element={<Sobre />} />
          <Route path="/contato"  element={<Contato />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/termos"   element={<Termos />} />
          <Route path="/post/:id" element={<Post />} />
          <Route path="/perfil"   element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/submeter" element={<PrivateRoute><Submeter /></PrivateRoute>} />
        </Route>

        {/* Painel admin com layout próprio */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index                element={<Dashboard />} />
          <Route path="spots"         element={<SpotList />} />
          <Route path="spots/novo"    element={<SpotForm />} />
          <Route path="spots/:id"     element={<SpotForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
