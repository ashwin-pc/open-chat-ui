import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy, dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

interface CodeBlockProps {
  language: string;
  value: string;
}

export const CodeBlock = ({ language, value }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const style = theme === 'dark' ? dracula : coy;

  return (
    <div className="relative">
      <SyntaxHighlighter language={language} style={style}>
        {value}
      </SyntaxHighlighter>
      <button onClick={handleCopy} className="absolute top-2 right-2 text-foreground p-0 rounded">
        {copied ? <span className="text-sm">Copied</span> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
};
