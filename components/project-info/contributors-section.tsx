import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnalysisData, ContributorAvatarProps } from './types';

// Function to load analysis data dynamically
function loadAnalysisData(): AnalysisData | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./git-commit-analysis.json') as AnalysisData;
  } catch (error) {
    console.warn('Git commit analysis data not found. Run `npm run analyze-commits` first.');
    return null;
  }
}

function ContributorAvatar({ username, commitCount, rank }: ContributorAvatarProps) {
  // Generate initials from username
  const initials = username
    .split(/[-_.]/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  // Theme-aware color scheme based on rank for fallback
  const getFallbackColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-br from-slate-400 to-slate-600';
    if (rank === 3) return 'bg-gradient-to-br from-amber-500 to-amber-700';
    return 'bg-gradient-to-br from-blue-500 to-blue-700';
  };

  return (
    <div className="relative group">
      <a href={`https://phonetool.amazon.com/users/${username}`} target="_blank" rel="noopener noreferrer">
        <Avatar className="h-12 w-12 border-2 border-border hover:border-primary transition-colors cursor-pointer">
          <AvatarImage
            src={`https://internal-cdn.amazon.com/badgephotos.amazon.com/?uid=${username}`}
            className="object-cover"
            alt={username}
          />
          <AvatarFallback className={`text-white font-bold text-sm ${getFallbackColor(rank)}`}>
            {initials}
          </AvatarFallback>
        </Avatar>
      </a>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded shadow-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="font-medium">{username}</div>
        <div className="text-muted-foreground">{commitCount.toLocaleString()} commits</div>
      </div>
    </div>
  );
}

export function ContributorsSection() {
  // Process the analysis data
  const contributorsData = useMemo(() => {
    const analysisData = loadAnalysisData();

    if (!analysisData) {
      return {
        contributors: [],
        summary: {
          total_repositories: 0,
          total_unique_authors: 0,
          total_commits: 0,
          repositories: [],
        },
      };
    }

    // Sort contributors by commit count
    const sortedContributors = Object.entries(analysisData.global_stats || {})
      .map(([username, commits]) => ({ username, commits: commits as number }))
      .sort((a, b) => b.commits - a.commits)
      .map((contributor, index) => ({ ...contributor, rank: index + 1 }));

    return {
      contributors: sortedContributors,
      summary: analysisData.summary || {
        total_repositories: 0,
        total_unique_authors: 0,
        total_commits: 0,
        repositories: [],
      },
    };
  }, []);

  const { contributors, summary } = contributorsData;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">Contributors</h3>
        <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-sm font-medium">
          {summary.total_unique_authors}
        </span>
      </div>

      {contributors.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            No contributor data available. Run{' '}
            <code className="bg-muted px-2 py-1 rounded text-sm">npm run analyze-commits</code> to generate contributor
            statistics.
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3 mb-4">
            {contributors.map(({ username, commits, rank }) => (
              <ContributorAvatar key={username} username={username} commitCount={commits} rank={rank} />
            ))}
          </div>

          {/* Repository Summary */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{summary.total_commits.toLocaleString()}</span> commits across{' '}
            <span className="font-medium">{summary.total_repositories}</span>{' '}
            {summary.total_repositories === 1 ? 'repository' : 'repositories'}
            {summary.repositories.length > 0 && <>: {summary.repositories.join(', ')}</>}
          </div>
        </>
      )}
    </section>
  );
}
