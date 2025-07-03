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
    jsx: 'jsx',
    react: 'jsx',
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

export interface ReactAppHtmlOptions {
  standalone?: boolean;
  title?: string;
  includeConsoleLogging?: boolean;
  includePostMessage?: boolean;
}

export const createReactAppHtml = (
  jsxCode: string,
  theme: 'light' | 'dark',
  options: ReactAppHtmlOptions = {},
): string => {
  const {
    standalone = false,
    title = standalone ? 'React App' : 'React App Preview',
    includeConsoleLogging = !standalone,
    includePostMessage = !standalone,
  } = options;

  const safeTitle = standalone ? sanitizeFilename(title) : title;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/framer-motion@10/dist/framer-motion.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background-color: ${theme === 'dark' ? '#0f172a' : '#ffffff'};
      color: ${theme === 'dark' ? '#f8fafc' : '#1e293b'};
      min-height: 100vh;
    }
    #root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .error-boundary {
      padding: 20px;
      background-color: #fef2f2;
      color: #991b1b;
      border-radius: 8px;
      margin: 20px;
      border: 1px solid #fecaca;
    }
    ${
      theme === 'dark'
        ? `
      .error-boundary {
        background-color: #1f2937;
        color: #ef4444;
        border-color: #374151;
      }`
        : ''
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    
    // Get Framer Motion from global (v10 exposes as window.Motion)
    const framerMotion = window.Motion || window.FramerMotion || {};
    const { motion, AnimatePresence, useAnimation, useMotionValue, useTransform, useAnimationControls } = framerMotion;

    // Error Boundary Component
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      componentDidCatch(error, errorInfo) {
        ${
          includeConsoleLogging
            ? "console.error('React Error:', error, errorInfo);"
            : '// Error logging disabled for standalone export'
        }
        ${
          includePostMessage
            ? `window.parent?.postMessage({ 
          type: 'error', 
          message: error.toString(),
          stack: error.stack 
        }, '*');`
            : '// PostMessage disabled for standalone export'
        }
      }

      render() {
        if (this.state.hasError) {
          return (
            <div className="error-boundary">
              <h2>Something went wrong</h2>
              <p>{this.state.error?.toString()}</p>
            </div>
          );
        }
        return this.props.children;
      }
    }

    ${
      includeConsoleLogging
        ? `
    // Console override to capture logs
    const originalConsole = { ...console };
    ['log', 'warn', 'error', 'info'].forEach(method => {
      console[method] = (...args) => {
        originalConsole[method](...args);
        ${
          includePostMessage
            ? `window.parent?.postMessage({ 
          type: 'console', 
          level: method,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ')
        }, '*');`
            : ''
        }
      };
    });`
        : ''
    }

    // User's React Component
    try {
      ${jsxCode}
      
      // If there's a default export or App component, render it
      let ComponentToRender = null;
      if (typeof App !== 'undefined') {
        ComponentToRender = App;
      } else if (typeof Component !== 'undefined') {
        ComponentToRender = Component;
      } else {
        // Try to find any React component in the global scope
        const possibleComponents = Object.keys(window).filter(key => 
          typeof window[key] === 'function' && 
          key[0] === key[0].toUpperCase()
        );
        if (possibleComponents.length > 0) {
          ComponentToRender = window[possibleComponents[0]];
        }
      }

      if (ComponentToRender) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
          React.createElement(ErrorBoundary, null,
            React.createElement(ComponentToRender)
          )
        );
        ${includePostMessage ? `window.parent?.postMessage({ type: 'ready' }, '*');` : ''}
      } else {
        throw new Error('No React component found. Please define an App component or export a default component.');
      }
    } catch (error) {
      console.error('Compilation Error:', error);
      document.getElementById('root').innerHTML = \`
        <div class="error-boundary">
          <h2>Compilation Error</h2>
          <p>\${error.message}</p>
        </div>
      \`;
      ${
        includePostMessage
          ? `window.parent?.postMessage({ 
        type: 'error', 
        message: error.message 
      }, '*');`
          : ''
      }
    }
  </script>
</body>
</html>${standalone ? '' : '\n'}`;
};
