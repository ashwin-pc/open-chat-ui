export const getLanguageExtension = (language: string): string => {
  const languageExtensions: { [key: string]: string } = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    'c++': 'cpp',
    csharp: 'cs',
    php: 'php',
    ruby: 'rb',
    swift: 'swift',
    go: 'go',
    rust: 'rs',
    html: 'html',
    css: 'css',
    sql: 'sql',
    shell: 'sh',
    bash: 'sh',
    powershell: 'ps1',
    yaml: 'yml',
    json: 'json',
    xml: 'xml',
    kotlin: 'kt',
  };

  return languageExtensions[language.toLowerCase()] || 'txt';
};

export const downloadTextFile = (content: string, filename: string, extension: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = url;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const sanitizeFilename = (filename: string): string => {
  return (
    filename
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .trim() || 'untitled'
  );
};
