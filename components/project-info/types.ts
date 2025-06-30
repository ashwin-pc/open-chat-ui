// Type definitions for project info components

export interface AnalysisData {
  global_stats: { [username: string]: number };
  per_repository: { [repoName: string]: { [username: string]: number } };
  summary: {
    total_repositories: number;
    total_unique_authors: number;
    total_commits: number;
    repositories: string[];
  };
}

export interface ChangelogEntry {
  type: string;
  title: string;
}

export interface ChangelogDateEntry {
  date: string;
  changes: ChangelogEntry[];
}

export interface ChangelogData {
  entries: ChangelogDateEntry[];
}

export interface ProjectLink {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  external: boolean;
}

export interface ContributorAvatarProps {
  username: string;
  commitCount: number;
  rank: number;
}