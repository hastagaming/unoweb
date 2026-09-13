import { projectsApi } from '../features/projects/projects-api';

export interface RecoveryCandidate {
  path: string;
  localContent: string;
  remoteContent: string;
}

export async function findRecoverableDrafts(
  projectId: string
): Promise<RecoveryCandidate[]> {
  const remoteFiles = await projectsApi.listFiles(projectId);
  const candidates: RecoveryCandidate[] = [];

  for (const file of remoteFiles) {
    const key = `unoweb:draft:${projectId}:${file.path}`;
    const localContent = localStorage.getItem(key);
    if (localContent !== null && localContent !== file.content) {
      candidates.push({
        path: file.path,
        localContent,
        remoteContent: file.content,
      });
    }
  }

  return candidates;
}

export function discardLocalDraft(projectId: string, path: string) {
  localStorage.removeItem(`unoweb:draft:${projectId}:${path}`);
}
