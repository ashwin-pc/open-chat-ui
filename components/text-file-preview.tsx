const FILE_CATEGORIES = [
  {
    name: 'Text',
    exts: ['txt', 'md', 'markdown', 'rst', 'adoc', 'asciidoc', 'log'],
  },
  {
    name: 'Data',
    exts: ['csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'toml'],
  },
  {
    name: 'Web',
    exts: [
      'html',
      'htm',
      'xhtml',
      'css',
      'scss',
      'sass',
      'less',
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
    ],
  },
  {
    name: 'JavaScript',
    exts: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
  },
  {
    name: 'Python',
    exts: ['py', 'pyw', 'ipynb'],
  },
  {
    name: 'Java',
    exts: ['java', 'jar', 'scala', 'sc', 'kt', 'kts', 'gradle'],
  },
  {
    name: 'C/C++',
    exts: ['c', 'h', 'cpp', 'cc', 'cxx', 'hpp', 'hh', 'hxx', 'ino'],
  },
  {
    name: '.NET',
    exts: ['cs', 'csx', 'vb', 'vbs', 'fs', 'fsi', 'fsx', 'fsscript'],
  },
  {
    name: 'Script',
    exts: ['sh', 'bash', 'zsh', 'ksh', 'csh', 'fish', 'bat', 'cmd', 'ps1', 'psm1', 'psd1', 'ps1xml', 'psc1', 'pssc'],
  },
  {
    name: 'Ruby',
    exts: ['rb'],
  },
  {
    name: 'PHP',
    exts: ['php', 'php3', 'php4', 'php5', 'php7', 'php8'],
  },
  {
    name: 'Database',
    exts: ['sql', 'tsql', 'psql', 'mysql', 'pgsql', 'pks', 'pkb', 'prc'],
  },
  {
    name: 'Config',
    exts: [
      'ini',
      'conf',
      'cfg',
      'env',
      'properties',
      'dockerfile',
      'gitignore',
      'gitattributes',
      'gitmodules',
      'npmrc',
      'yarnrc',
      'editorconfig',
      'babelrc',
      'eslintrc',
      'eslintignore',
      'prettierrc',
      'stylelintrc',
      'dockerignore',
      'env',
    ],
  },
  {
    name: 'CI/CD',
    exts: [
      'yml',
      'yaml',
      'circleci',
      'travis.yml',
      'appveyor.yml',
      'gitlab-ci.yml',
      'jenkinsfile',
      'bitbucket-pipelines.yml',
      'dependabot.yml',
      'dependabot.yaml',
      'codecov.yml',
      'codecov.yaml',
    ],
  },
  {
    name: 'Functional',
    exts: ['hs', 'lhs', 'clj', 'cljs', 'cljc', 'edn', 'ml', 'mli', 'elm', 'cr', 'ecr'],
  },
  {
    name: 'Systems',
    exts: ['rs', 'go', 'swift', 'm', 'mm', 'nim', 'nimble'],
  },
  {
    name: 'Document',
    exts: ['tex', 'bib', 'sty', 'cls', 'clo', 'dtx', 'ins', 'ltx', 'mkii'],
  },
  {
    name: 'Other',
    exts: [
      'pl',
      'cgi',
      'tcl',
      'lua',
      'groovy',
      'r',
      'rmd',
      'rnw',
      'jl',
      'dart',
      'ex',
      'exs',
      'erl',
      'hrl',
      'adb',
      'ads',
      'ada',
      'asm',
      's',
      'S',
      'd',
      'rkt',
      'lisp',
      'lsp',
      'cl',
      'scm',
      'coffee',
      'litcoffee',
      'graphql',
      'gql',
      'tf',
      'tfvars',
      'hcl',
      'po',
      'pot',
      'mo',
      'resx',
      'rc',
    ],
  },
];

const getFileType = (extension: string): string => {
  const normalizedExt = extension.toLowerCase();
  const category = FILE_CATEGORIES.find((cat) => cat.exts.includes(normalizedExt));
  return category ? category.name : 'File';
};

const getFileIcon = (extension: string) => {
  const fileType = getFileType(extension);

  switch (fileType) {
    case 'Text':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'Data':
    case 'Database':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2 1.5 3 3 3h10c1.5 0 3-1 3-3V7c0-2-1.5-3-3-3H7c-1.5 0-3 1-3 3zm0 5h16M8 5v14m8-14v14"
          />
        </svg>
      );
    case 'JavaScript':
    case 'Python':
    case 'Java':
    case 'C/C++':
    case '.NET':
    case 'Ruby':
    case 'PHP':
    case 'Functional':
    case 'Systems':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      );
    case 'Web':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      );
    case 'Config':
    case 'CI/CD':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
  }
};
export const TextFilePreview = ({ filename }: { filename: string }) => {
  const extension = filename.split('.').pop() || '';

  return (
    <div className="flex items-center bg-secondary rounded-[var(--radius)] p-4 shadow-sm w-48">
      <div className="flex items-center space-x-3">
        <div className="text-muted-foreground">{getFileIcon(extension)}</div>
        <div className="flex flex-col">
          <span className="text-primary font-medium mb-1 truncate">{filename}</span>
          <span className="text-muted-foreground text-xs tracking-wide uppercase">{getFileType(extension)}</span>
        </div>
      </div>
    </div>
  );
};
