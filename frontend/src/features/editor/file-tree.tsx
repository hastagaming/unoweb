import type { ProjectFile } from '../../types';

interface TreeNode {
  name: string;
  fullPath: string;
  isFile: boolean;
  children: TreeNode[];
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean);
    let currentLevel = root;
    let accumulatedPath = '';

    segments.forEach((segment, index) => {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;
      const isFile = index === segments.length - 1;
      let node = currentLevel.find((n) => n.name === segment && n.isFile === isFile);

      if (!node) {
        node = { name: segment, fullPath: accumulatedPath, isFile, children: [] };
        currentLevel.push(node);
      }

      currentLevel = node.children;
    });
  }

  return root;
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return [...nodes]
    .sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    })
    .map((n) => ({ ...n, children: sortTree(n.children) }));
}

interface FileTreeProps {
  files: ProjectFile[];
  activePath: string | null;
  onSelectFile: (path: string) => void;
}

export function FileTree({ files, activePath, onSelectFile }: FileTreeProps) {
  const tree = sortTree(buildTree(files));
  return (
    <nav className="file-tree">
      <TreeLevel nodes={tree} depth={0} activePath={activePath} onSelectFile={onSelectFile} />
    </nav>
  );
}

function TreeLevel({
  nodes,
  depth,
  activePath,
  onSelectFile,
}: {
  nodes: TreeNode[];
  depth: number;
  activePath: string | null;
  onSelectFile: (path: string) => void;
}) {
  return (
    <ul style={{ paddingLeft: depth === 0 ? 0 : 12 }}>
      {nodes.map((node) => (
        <li key={node.fullPath}>
          {node.isFile ? (
            <button
              className={node.fullPath === activePath ? 'file-node active' : 'file-node'}
              onClick={() => onSelectFile(node.fullPath)}
            >
              {node.name}
            </button>
          ) : (
            <>
              <span className="folder-node">{node.name}/</span>
              <TreeLevel
                nodes={node.children}
                depth={depth + 1}
                activePath={activePath}
                onSelectFile={onSelectFile}
              />
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
