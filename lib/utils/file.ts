import { encode } from 'gpt-tokenizer';
import { Attachment, Message } from '../types';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_TOKENS_PER_FILE = 160000;

export const ALLOWED_FILE_EXTENSIONS = [
  // Markup and General Text Files
  'txt',
  'md',
  'markdown',
  'rst',
  'adoc',
  'asciidoc',
  'log',
  'csv',
  'tsv',
  'json',
  'xml',
  'yaml',
  'yml',
  'toml',
  'ini',
  'conf',
  'cfg',

  // Web Development
  'html',
  'htm',
  'xhtml',
  'css',
  'scss',
  'sass',
  'less',

  // JavaScript and TypeScript
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',

  // Backend and Scripting Languages
  'py',
  'pyw',
  'rb',
  'php',
  'php3',
  'php4',
  'php5',
  'php7',
  'php8',
  'pl',
  'cgi',
  'tcl',
  'lua',
  'groovy',
  'ps1',
  'psm1',
  'sh',
  'bash',
  'zsh',
  'ksh',
  'csh',
  'fish',
  'bat',
  'cmd',

  // Java and JVM Languages
  'java',
  'jar',
  'properties',
  'scala',
  'sc',
  'kt',
  'kts',
  'gradle',

  // C and C++ Languages
  'c',
  'h',
  'cpp',
  'cc',
  'cxx',
  'hpp',
  'hh',
  'hxx',
  'ino',

  // C# and .NET Languages
  'cs',
  'csx',
  'vb',
  'vbs',
  'fs',
  'fsi',
  'fsx',
  'fsscript',

  // Functional Languages
  'hs',
  'lhs',
  'clj',
  'cljs',
  'cljc',
  'edn',
  'ml',
  'mli',
  'fs',
  'fsi',
  'fsx',
  'fsscript',

  // Data Science and Statistical Languages
  'r',
  'rmd',
  'rnw',
  'jl',

  // Other Programming Languages
  'go',
  'rs',
  'swift',
  'm',
  'mm',
  'dart',
  'ex',
  'exs',
  'erl',
  'hrl',
  'sql',
  'pks',
  'pkb',
  'prc',
  'sql',
  'adb',
  'ads',
  'ada',
  'asm',
  's',
  'S',
  'd',
  'nim',
  'nimble',
  'rkt',
  'lisp',
  'lsp',
  'cl',
  'scm',
  'coffee',
  'litcoffee',
  'elm',
  'cr',
  'ecr',
  'res',
  'resi',

  // Configuration and Build Files
  'makefile',
  'mk',
  'cmake',
  'cmake.in',
  'gradle',
  'pom',
  'pom.xml',
  'build.xml',
  'pro',
  'gyp',
  'gypi',
  'ini',
  'cfg',
  'conf',
  'editorconfig',
  'eslintrc',
  'eslintignore',
  'prettierrc',
  'stylelintrc',
  'babelrc',

  // Template and Markup Files
  'ejs',
  'hbs',
  'handlebars',
  'mustache',
  'pug',
  'jade',
  'njk',
  'nunjucks',
  'twig',
  'liquid',
  'haml',
  'slim',

  // Documentation and Literate Programming
  'ipynb',
  'tex',
  'bib',
  'sty',
  'cls',
  'clo',
  'dtx',
  'ins',
  'ltx',
  'mkii',

  // Miscellaneous
  'env',
  'dockerfile',
  'ignore',
  'gitignore',
  'gitattributes',
  'gitmodules',
  'npmignore',
  'yarnrc',
  'npmrc',
  'editorconfig',
  'babelrc',
  'eslintignore',
  'prettierrc',
  'stylelintignore',
  'markdownlintignore',
  'dockerignore',
  'slugignore',
  'hgignore',
  'jshintrc',
  'mocharc',
  'nodemon.json',
  'dependabot.yml',
  'dependabot.yaml',
  'codecov.yml',
  'codecov.yaml',

  // Scripting and Automation
  'ps1',
  'psd1',
  'psm1',
  'ps1xml',
  'psc1',
  'pssc',

  // CI/CD and DevOps
  'yml',
  'yaml',
  'circleci',
  'travis.yml',
  'appveyor.yml',
  'gitlab-ci.yml',
  'jenkinsfile',
  'bitbucket-pipelines.yml',

  // Container and Orchestration
  'dockerfile',
  'compose.yml',
  'compose.yaml',
  'k8s.yml',
  'k8s.yaml',

  // Query Languages
  'graphql',
  'gql',

  // Infrastructure as Code
  'tf',
  'tfvars',
  'hcl',

  // Additional Languages and Scripts
  'tsql',
  'psql',
  'mysql',
  'pgsql',
  'pig',
  'hql',
  'sage',
  'scpt',
  'rpy',
  'ipynb',
  'sas',
  'stan',
  'apl',
  'ivy',
  'j',
  'bro',
  'm4',
  'j2',
  'erb',
  'feature',

  // Version Control and Metadata
  'gitignore',
  'gitattributes',
  'gitmodules',
  'hgignore',
  'hgrc',
  'bazel',
  'bzl',
  'buck',
  'patch',

  // Localization and Internationalization
  'po',
  'pot',
  'mo',
  'properties',
  'resx',
  'rc',
];

export async function parseFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const baseName = file.name.toLowerCase();

  // List of accepted filenames without extensions
  const acceptedFilenames = [
    'makefile',
    'dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    'jenkinsfile',
    'license',
    'readme',
    'changelog',
    'contributing',
    'codeowners',
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
