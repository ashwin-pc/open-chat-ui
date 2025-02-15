import { isToday, isWithinInterval, subDays } from 'date-fns';
import { ThreadSummary } from '../types';

export type CategoryThreads = {
  today: ThreadSummary[];
  lastWeek: ThreadSummary[];
  lastMonth: ThreadSummary[];
  older: ThreadSummary[];
};

export const categorizeThreads = (threads: ThreadSummary[]): CategoryThreads => {
  const today = new Date();

  const sortedThreads = [...threads].sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

  return sortedThreads.reduce(
    (acc: CategoryThreads, thread) => {
      const threadDate = thread.lastUpdated;

      if (isToday(threadDate)) {
        acc.today.push(thread);
      } else if (
        isWithinInterval(threadDate, {
          start: subDays(today, 7),
          end: today,
        })
      ) {
        acc.lastWeek.push(thread);
      } else if (
        isWithinInterval(threadDate, {
          start: subDays(today, 30),
          end: today,
        })
      ) {
        acc.lastMonth.push(thread);
      } else {
        acc.older.push(thread);
      }

      return acc;
    },
    {
      today: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    },
  );
};
