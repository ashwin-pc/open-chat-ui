import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as yaml from 'js-yaml';
import { ChangelogData } from './types';

// Function to load changelog data from public YAML file
async function loadChangelog(): Promise<ChangelogData | null> {
  try {
    const response = await fetch('/changelog.yaml');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const changelogContent = await response.text();
    return yaml.load(changelogContent) as ChangelogData;
  } catch (error) {
    console.warn('Changelog data not found:', error);
    return null;
  }
}

export function ChangelogSection() {
  const [changelogData, setChangelogData] = useState<ChangelogData | null>(null);
  const [changelogLoading, setChangelogLoading] = useState(true);
  const [expandedChangelog, setExpandedChangelog] = useState(false);

  // Load changelog data on component mount
  useEffect(() => {
    loadChangelog().then(data => {
      setChangelogData(data);
      setChangelogLoading(false);
    });
  }, []);

  // Process changelog data and implement grouping logic
  const processedChangelogData = useMemo(() => {
    if (!changelogData || !changelogData.entries) {
      return {
        groupedEntries: {},
        visibleGroups: {},
        hasMoreEntries: false,
        totalEntries: 0
      };
    }

    // Map type values to display names
    const getDisplayType = (type: string) => {
      switch (type) {
        case 'feature': return 'Features';
        case 'improvement': return 'Improvements';
        case 'bugfix': return 'Bug Fixes';
        case 'documentation': return 'Documentation';
        case 'maintenance': return 'Maintenance';
        case 'security': return 'Security';
        default: return type.charAt(0).toUpperCase() + type.slice(1);
      }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    // Group entries by date, keeping them sorted by date (newest first)
    const sortedEntries = [...changelogData.entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const groupedEntries: { [key: string]: Array<{ type: string; title: string }> } = {};
    let totalEntries = 0;

    sortedEntries.forEach(dateEntry => {
      const formattedDate = formatDate(dateEntry.date);
      groupedEntries[formattedDate] = dateEntry.changes.map(change => ({
        ...change,
        type: getDisplayType(change.type)
      }));
      totalEntries += dateEntry.changes.length;
    });

    // For visibility control, limit total entries shown
    const maxEntries = expandedChangelog ? totalEntries : 5;
    const visibleGroups: { [key: string]: Array<{ type: string; title: string }> } = {};
    let currentCount = 0;

    for (const [date, entries] of Object.entries(groupedEntries)) {
      if (currentCount >= maxEntries) break;
      
      const remainingSlots = maxEntries - currentCount;
      visibleGroups[date] = entries.slice(0, remainingSlots);
      currentCount += visibleGroups[date].length;
    }

    const hasMoreEntries = totalEntries > 5;

    return {
      groupedEntries,
      visibleGroups,
      hasMoreEntries,
      totalEntries
    };
  }, [changelogData, expandedChangelog]);

  return (
    <section>
      <h3 className="text-lg font-semibold mb-4 text-foreground">What&apos;s New</h3>
      {changelogLoading ? (
        <div className="text-sm text-muted-foreground">
          Loading changelog...
        </div>
      ) : Object.keys(processedChangelogData.visibleGroups).length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No changelog entries available.
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(processedChangelogData.visibleGroups).map(([date, entries]) => (
            <div key={date}>
              <h4 className="font-medium text-foreground text-sm mb-1.5 opacity-90">{date}</h4>
              <div className="space-y-1">
                {entries.map((entry, index) => (
                  <div key={index} className="border-l-2 border-muted pl-3 py-0.5">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-foreground">{entry.title}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                        {entry.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {processedChangelogData.hasMoreEntries && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedChangelog(!expandedChangelog)}
              className="mt-2 text-muted-foreground hover:text-foreground"
            >
              {expandedChangelog ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show all ({processedChangelogData.totalEntries})
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}