import { useEffect, useState } from 'react';
import { projectsApi } from '../projects/projects-api';
import type { ProjectVersion } from '../../types';

interface VersionHistoryPanelProps {
  projectId: string;
  userId: string;
  onRestored: () => void;
  onClose: () => void;
}

export function VersionHistoryPanel({
  projectId,
  userId,
  onRestored,
  onClose,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadVersions();
  }, []);

  async function loadVersions() {
    setIsLoading(true);
    try {
      setVersions(await projectsApi.listVersions(projectId));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRestore(version: ProjectVersion) {
    if (!confirm(`Restore "${version.label}"? Your current state will be kept as a version too.`)) return;
    try {
      await projectsApi.restoreVersion(projectId, version, userId);
      onRestored();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  }

  return (
    <aside className="version-history-panel">
      <header>
        <h2>Version History</h2>
        <button onClick={onClose}>Close</button>
      </header>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {isLoading && <p>Loading versions...</p>}

      <ul>
        {versions.map((version) => (
          <li key={version.id}>
            <div>
              <strong>{version.label}</strong>
              <span className="version-meta">
                {new Date(version.createdAt).toLocaleString()} - {version.reason}
              </span>
            </div>
            <button onClick={() => void handleRestore(version)}>Restore</button>
          </li>
        ))}
        {!isLoading && versions.length === 0 && <p>No versions yet.</p>}
      </ul>
    </aside>
  );
}
