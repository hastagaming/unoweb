import Editor, { type OnMount } from '@monaco-editor/react';
import { useRef } from 'react';
import { detectLanguageFromPath, FORMATTABLE_LANGUAGES } from '../../lib/language-detection';

interface CodeEditorProps {
  path: string;
  content: string;
  onChange: (newContent: string) => void;
}

export function CodeEditor({ path, content, onChange }: CodeEditorProps) {
  const language = detectLanguageFromPath(path);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  function handleFormat() {
    if (!FORMATTABLE_LANGUAGES.has(language)) return;
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  }

  return (
    <div className="code-editor">
      <div className="code-editor-toolbar">
        <span className="code-editor-path">{path}</span>
        {FORMATTABLE_LANGUAGES.has(language) ? (
          <button onClick={handleFormat}>Format Document</button>
        ) : (
          <span
            className="code-editor-format-unavailable"
            title="No server-side formatter installed yet for this language"
          >
            Format: not available for {language}
          </span>
        )}
      </div>
      <Editor
        height="calc(100vh - 160px)"
        language={language}
        value={content}
        theme="vs-dark"
        onMount={handleMount}
        onChange={(value) => onChange(value ?? '')}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
