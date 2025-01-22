import { ChatThread } from "@/lib/types";
import { format, isToday, isWithinInterval, subDays } from 'date-fns';

export type CategoryThreads = {
    today: ChatThread[];
    lastWeek: ChatThread[];
    lastMonth: ChatThread[];
    older: ChatThread[];
};

export const categorizeThreads = (threads: ChatThread[]): CategoryThreads => {
    const today = new Date();

    return threads.reduce((acc: CategoryThreads, thread) => {
        const threadDate = new Date(thread.branches[0].createdAt);

        if (isToday(threadDate)) {
            acc.today.push(thread);
        } else if (isWithinInterval(threadDate, {
            start: subDays(today, 7),
            end: today
        })) {
            acc.lastWeek.push(thread);
        } else if (isWithinInterval(threadDate, {
            start: subDays(today, 30),
            end: today
        })) {
            acc.lastMonth.push(thread);
        } else {
            acc.older.push(thread);
        }

        return acc;
    }, {
        today: [],
        lastWeek: [],
        lastMonth: [],
        older: []
    });
};