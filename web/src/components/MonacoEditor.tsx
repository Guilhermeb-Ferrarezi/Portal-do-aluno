import React from "react";
import Editor, { type EditorProps } from "@monaco-editor/react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  theme?: "light" | "dark";
  height?: string | number;
  readOnly?: boolean;
  showLineNumbers?: boolean;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "typescript", label: "TypeScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "plaintext", label: "Texto Simples" },
];

export default function MonacoEditor({
  value,
  onChange,
  language = "javascript",
  onLanguageChange,
  theme = "dark",
  height = "400px",
  readOnly = false,
  showLineNumbers = true,
}: MonacoEditorProps) {
  const editorRef = React.useRef<any>(null);
  const [currentLanguage, setCurrentLanguage] = React.useState(language);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setCurrentLanguage(newLanguage);
    onLanguageChange?.(newLanguage);
  };

  const handleMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="monacoEditorContainer">
      <div className="monacoEditorHeader">
        <label className="monacoLanguageLabel">
          Linguagem:
          <select
            className="monacoLanguageSelect"
            value={currentLanguage}
            onChange={handleLanguageChange}
            disabled={readOnly}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ border: "1px solid var(--line)", borderRadius: "10px", overflow: "hidden" }}>
        <Editor
          height={height}
          language={currentLanguage}
          value={value}
          onChange={onChange}
          onMount={handleMount}
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "Fira Code, Consolas, monospace",
            lineNumbers: showLineNumbers ? "on" : "off",
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
            readOnly,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
