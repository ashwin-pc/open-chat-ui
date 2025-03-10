export const ARTIFACT_TYPES = {
  CODE: 'application/vnd.ant.code',
  MERMAID: 'application/vnd.ant.mermaid',
  MARKDOWN: 'text/markdown',
  SVG: 'image/svg+xml',
} as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[keyof typeof ARTIFACT_TYPES];

export type ViewType = 'code' | 'preview';

export interface EditorState {
  position?: {
    lineNumber: number;
    column: number;
  };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  scrollPosition?: {
    scrollTop: number;
    scrollLeft: number;
  };
}

export interface Artifact {
  identifier: string;
  title: string;
  artifactType: ArtifactType | null;
  codeLanguage: string | null;
  content: string;
}

export interface ArtifactsProps {
  artifact: Artifact;
  onChange?: (newCode: string) => void;
  theme?: 'light' | 'dark';
}
