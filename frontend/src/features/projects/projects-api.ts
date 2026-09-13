import { supabaseClient } from '../../lib/supabase-client';
import type { Project, ProjectFile, ProjectVersion } from '../../types';

export const projectsApi = {
  async listProjects(): Promise<Project[]> {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data.map(mapProject);
  },

  async listArchivedProjects(): Promise<Project[]> {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('is_archived', true)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data.map(mapProject);
  },

  async createProject(name: string, ownerId: string): Promise<Project> {
    const { data, error } = await supabaseClient
      .from('projects')
      .insert({ name, owner_id: ownerId })
      .select()
      .single();
    if (error) throw error;
    return mapProject(data);
  },

  async renameProject(projectId: string, name: string): Promise<void> {
    const { error } = await supabaseClient
      .from('projects')
      .update({ name })
      .eq('id', projectId);
    if (error) throw error;
  },

  async archiveProject(projectId: string, isArchived: boolean): Promise<void> {
    const { error } = await supabaseClient
      .from('projects')
      .update({ is_archived: isArchived })
      .eq('id', projectId);
    if (error) throw error;
  },

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .eq('id', projectId);
    if (error) throw error;
  },

  async duplicateProject(projectId: string, newName: string, ownerId: string): Promise<Project> {
    const files = await this.listFiles(projectId);
    const newProject = await this.createProject(newName, ownerId);
    if (files.length > 0) {
      const { error } = await supabaseClient.from('project_files').insert(
        files.map((f) => ({
          project_id: newProject.id,
          path: f.path,
          content: f.content,
          language: f.language,
        }))
      );
      if (error) throw error;
    }
    return newProject;
  },

  async listFiles(projectId: string): Promise<ProjectFile[]> {
    const { data, error } = await supabaseClient
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('path');
    if (error) throw error;
    return data.map(mapFile);
  },

  async upsertFile(projectId: string, path: string, content: string, language: string): Promise<void> {
    const { error } = await supabaseClient
      .from('project_files')
      .upsert(
        { project_id: projectId, path, content, language },
        { onConflict: 'project_id,path' }
      );
    if (error) throw error;
  },

  async createVersionSnapshot(
    projectId: string,
    label: string,
    userId: string,
    reason: 'autosave' | 'manual' | 'restore'
  ): Promise<ProjectVersion> {
    const files = await this.listFiles(projectId);
    const snapshot: Record<string, string> = {};
    for (const f of files) snapshot[f.path] = f.content;

    const { data, error } = await supabaseClient
      .from('project_versions')
      .insert({
        project_id: projectId,
        label,
        files_snapshot: snapshot,
        created_by: userId,
        reason,
      })
      .select()
      .single();
    if (error) throw error;
    return mapVersion(data);
  },

  async listVersions(projectId: string): Promise<ProjectVersion[]> {
    const { data, error } = await supabaseClient
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data.map(mapVersion);
  },

  async restoreVersion(projectId: string, version: ProjectVersion, userId: string): Promise<void> {
    await this.createVersionSnapshot(projectId, 'Before restore (auto)', userId, 'autosave');

    const entries = Object.entries(version.filesSnapshot);
    if (entries.length > 0) {
      const { error } = await supabaseClient.from('project_files').upsert(
        entries.map(([path, content]) => ({
          project_id: projectId,
          path,
          content,
          language: 'plaintext',
        })),
        { onConflict: 'project_id,path' }
      );
      if (error) throw error;
    }

    await this.createVersionSnapshot(
      projectId,
      `Restored: ${version.label}`,
      userId,
      'restore'
    );
  },

  async exportProject(projectId: string): Promise<string> {
    const [project, files] = await Promise.all([
      supabaseClient.from('projects').select('*').eq('id', projectId).single(),
      this.listFiles(projectId),
    ]);
    if (project.error) throw project.error;
    return JSON.stringify(
      { project: mapProject(project.data), files },
      null,
      2
    );
  },
};

function mapProject(row: any): Project {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    platformId: row.platform_id,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFile(row: any): ProjectFile {
  return {
    id: row.id,
    projectId: row.project_id,
    path: row.path,
    content: row.content,
    language: row.language,
    updatedAt: row.updated_at,
  };
}

function mapVersion(row: any): ProjectVersion {
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    filesSnapshot: row.files_snapshot,
    createdBy: row.created_by,
    createdAt: row.created_at,
    reason: row.reason,
  };
}
