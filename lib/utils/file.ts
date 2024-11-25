import { encode } from 'gpt-tokenizer';
import { Attachment, Message } from '../types';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_TOKENS_PER_FILE = 160000;

export const ALLOWED_FILE_EXTENSIONS = [
  // Documentation and Text
  '.txt',
  '.md',
  '.markdown',
  '.rst',
  '.log',
  // Data Files
  '.json',
  '.csv',
  '.tsv',
  '.xml',
  '.yaml',
  '.yml',
  // Config Files
  '.toml',
  '.ini',
  '.conf',
  '.cfg',
  // Web Development
  '.html',
  '.css',
  '.scss',
  '.sass',
  // JavaScript/TypeScript
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  // Backend Languages
  '.py',
  '.rb',
  '.php',
  '.java',
  '.go',
  // Shell Scripts
  '.sh',
  '.bash',
  '.zsh',
  '.ps1',
];

export async function parseFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const baseName = file.name.toLowerCase();

  // List of accepted filenames without extensions
  const acceptedFilenames = [
    'makefile',
    'dockerfile',
    'docker-compose.yml',
    'jenkinsfile',
    'license',
    'readme',
    'changelog',
  ];

  if (!ALLOWED_FILE_EXTENSIONS.includes(extension) && !acceptedFilenames.includes(baseName)) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;
      resolve(content);
    };

    reader.onerror = () => reject(new Error('Error reading file'));

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    reader.readAsText(file);
  });
}

export function getTokenCount(text: string): number {
  try {
    return encode(text).length;
  } catch (error) {
    console.error('Error calculating tokens:', error);
    return 0;
  }
}

export const formatAttachments = (attachments: Attachment[]): string => {
  return attachments
    .map((attachment) => {
      return `<file name="${attachment.name}">\n${attachment.content}\n</file>\n\n`;
    })
    .join('');
};

export const formatAttachmentMessage = (message: Message): string => {
  if (!message.attachments) return message.text;
  const attachmentContent = formatAttachments(message.attachments);
  return attachmentContent + message.text;
};
