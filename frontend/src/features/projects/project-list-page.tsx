import { useEffect, useState } from 'react';
import { useAuth } from '../auth/auth-context';
import { projectsApi } from './projects-api';
import type { Project } from '../../types';

export function ProjectListPage() {
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    setIsLoading(true);
    try {
      setProjects(await projectsApi.listProjects());
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!user || !newProjectName.trim()) return;
    try {
      await projectsApi.createProject(newProjectName.trim(), user.id);
      setNewProjectName('');
      await loadProjects();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  }

  async function handleArchive(projectId: string) {
    await projectsApi.archiveProject(projectId, true);
    await loadProjects();
  }

  async function handleDelete(projectId: string) {
    if (!confirm('Delete this project permanently? This cannot be undone.')) return;
    await projectsApi.deleteProject(projectId);
    await loadProjects();
  }

  return (
    <main className="project-list-page">
      <header>
        <h1>UnoWeb Projects</h1>
        <button onClick={() => void signOut()}>Sign out</button>
      </header>

      <section className="create-project">
        <input
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New project name"
        />
        <button onClick={() => void handleCreate()}>Create project</button>
      </section>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {isLoading && <p>Loading projects...</p>}

      <ul className="project-grid">
        {projects.map((project) => (
          <li key={project.id} className="project-card">
            <a href={`/projects/${project.id}`}>{project.name}</a>
            <div className="project-card-actions">
              <button onClick={() => void handleArchive(project.id)}>Archive</button>
              <button onClick={() => void handleDelete(project.id)}>Delete</button>
            </div>
          </li>
        ))}
        {!isLoading && projects.length === 0 && (
          <p>No projects yet. Create your first one above.</p>
        )}
      </ul>
    </main>
  );
}
