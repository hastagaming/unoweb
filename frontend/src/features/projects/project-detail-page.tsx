import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { projectsApi } from './projects-api';
import { useAutosave } from '../../lib/autosave';
import {
  findRecoverableDrafts,
  discardLocalDraft,
  type RecoveryCandidate,
} from '../../lib/crash-recovery';
import { detectLanguageFromPath } from '../../lib/language-detection';
import { FileTree } from '../editor/file-tree';
import { CodeEditor } from '../editor/code-editor';
import { VersionHistoryPanel } from '../editor/version-history-panel';
import type { ProjectFile } from '../../types';

export function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState('');
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [recoveryCandidates, setRecoveryCandidates] = useState<RecoveryCandidate[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { status: autosaveStatus, saveFile } = useAutosave(projectId ?? '', user?.id ?? '');

  useEffect(() => {
    if (!projectId) return;
    void loadFiles();
    void findRecoverableDrafts(projectId).then(setRecoveryCandidates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadFiles() {
    if (!projectId) return;
    try {
      const loaded = await projectsApi.listFiles(projectId);
      setFiles(loaded);
      if (!activePath && loaded.length > 0) {
        setActivePath(loaded[0].path);
        setActiveContent(loaded[0].content);
      }
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  }

  function handleSelectFile(path: string) {
    const file = files.find((f) => f.path === path);
    if (!file) return;
    setActivePath(path);
    setActiveContent(file.content);
  }

  function handleContentChange(newContent: string) {
    if (!activePath) return;
    setActiveContent(newContent);
    saveFile(activePath, newContent, detectLanguageFromPath(activePath));
    setFiles((prev) =>
      prev.map((f) => (f.path === activePath ? { ...f, content: newContent } : f))
    );
  }

  async function handleCreateFile() {
    if (!projectId || !newFileName.trim()) return;
    try {
      await projectsApi.upsertFile(
        projectId,
        newFileName.trim(),
        '',
        detectLanguageFromPath(newFileName.trim())
      );
      setNewFileName('');
      await loadFiles();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  }

  function handleUseLocalDraft(candidate: RecoveryCandidate) {
    handleSelectFile(candidate.path);
    setActiveContent(candidate.localContent);
    saveFile(candidate.path, candidate.localContent, detectLanguageFromPath(candidate.path));
    setRecoveryCandidates((prev) => prev.filter((c) => c.path !== candidate.path));
  }

  function handleDiscardLocalDraft(candidate: RecoveryCandidate) {
    if (!projectId) return;
    discardLocalDraft(projectId, candidate.path);
    setRecoveryCandidates((prev) => prev.filter((c) => c.path !== candidate.path));
  }

  if (!projectId || !user) return <p>Loading...</p>;

  return (
    <div className="project-detail-page">
      {recoveryCandidates.length > 0 && (
        <div className="recovery-banner">
          <p>
            Unsaved local changes were found for {recoveryCandidates.length} file(s) from a
            previous session that never finished syncing.
          </p>
          <ul>
            {recoveryCandidates.map((candidate) => (
              <li key={candidate.path}>
                <span>{candidate.path}</span>
                <button onClick={() => handleUseLocalDraft(candidate)}>Use local draft</button>
                <button onClick={() => handleDiscardLocalDraft(candidate)}>Keep server version</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <header className="project-detail-header">
        <a href="/">Back to projects</a>
        <span className={`autosave-status autosave-${autosaveStatus}`}>
          {autosaveStatus === 'saved' && 'Saved'}
          {autosaveStatus === 'saving' && 'Saving...'}
          {autosaveStatus === 'offline' && 'Offline - changes kept locally'}
          {autosaveStatus === 'error' && 'Sync error - retrying'}
        </span>
        <button onClick={() => setIsVersionPanelOpen(true)}>Version History</button>
      </header>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="project-detail-body">
        <aside className="project-sidebar">
          <div className="new-file-row">
            <input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="src/main.cpp"
            />
            <button onClick={() => void handleCreateFile()}>Add file</button>
          </div>
          <FileTree files={files} activePath={activePath} onSelectFile={handleSelectFile} />
        </aside>

        <main className="editor-pane">
          {activePath ? (
            <CodeEditor path={activePath} content={activeContent} onChange={handleContentChange} />
          ) : (
            <p>No file selected. Create one from the sidebar.</p>
          )}
        </main>
      </div>

      {isVersionPanelOpen && (
        <VersionHistoryPanel
          projectId={projectId}
          userId={user.id}
          onRestored={() => {
            setIsVersionPanelOpen(false);
            void loadFiles();
          }}
          onClose={() => setIsVersionPanelOpen(false)}
        />
      )}
    </div>
  );
}
