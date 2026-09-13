import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/auth-context';
import { LoginPage } from './features/auth/login-page';
import { ProjectListPage } from './features/projects/project-list-page';
import { ProjectDetailPage } from './features/projects/project-detail-page';

export function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p>Loading...</p>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <ProjectListPage /> : <LoginPage />} />
        <Route
          path="/projects/:id"
          element={user ? <ProjectDetailPage /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
