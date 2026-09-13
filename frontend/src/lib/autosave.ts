import { useEffect, useRef, useState } from 'react';
import type { AutosaveStatus } from '../types';
import { projectsApi } from '../features/projects/projects-api';

const AUTOSAVE_DEBOUNCE_MS = 1500;
const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

export function useAutosave(projectId: string, userId: string) {
  const [status, setStatus] = useState<AutosaveStatus>('saved');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotRef = useRef<number>(Date.now());

  useEffect(() => {
    function handleOffline() {
      setStatus('offline');
    }
    function handleOnline() {
      setStatus('saved');
    }
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  function saveFile(path: string, content: string, language: string) {
    if (!navigator.onLine) {
      setStatus('offline');
      persistDraftLocally(projectId, path, content);
      return;
    }

    setStatus('saving');
    persistDraftLocally(projectId, path, content);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await projectsApi.upsertFile(projectId, path, content, language);
        clearDraftLocally(projectId, path);
        setStatus('saved');

        const now = Date.now();
        if (now - lastSnapshotRef.current > SNAPSHOT_INTERVAL_MS) {
          lastSnapshotRef.current = now;
          await projectsApi.createVersionSnapshot(
            projectId,
            `Autosave ${new Date().toLocaleString()}`,
            userId,
            'autosave'
          );
        }
      } catch {
        setStatus('error');
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  return { status, saveFile };
}

function draftKey(projectId: string, path: string) {
  return `unoweb:draft:${projectId}:${path}`;
}

function persistDraftLocally(projectId: string, path: string, content: string) {
  localStorage.setItem(draftKey(projectId, path), content);
}

function clearDraftLocally(projectId: string, path: string) {
  localStorage.removeItem(draftKey(projectId, path));
}
