import React from 'react';
import { ExternalLink, Code, MessageSquare, Slack } from 'lucide-react';
import { ProjectLink } from './types';

// Project links
const projectLinks: ProjectLink[] = [
  {
    title: "Slack",
    description: "Talk to the community and get support",
    icon: Slack,
    url: "https://amazon.enterprise.slack.com/archives/C06D7DQH2CQ",
    external: true
  },
  {
    title: "Repository",
    description: "Source code and project files",
    icon: Code,
    url: "https://code.amazon.com/packages/DiyaChatbotUI/trees/mainline",
    external: true
  },
  {
    title: "Issues & Feature Requests",
    description: "Submit bugs, issues, and feature requests",
    icon: MessageSquare,
    url: "https://quip-amazon.com/1EYbA28Fau2r/Diya-Backlog", 
    external: true
  }
];

export function LinksSection() {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-3 text-foreground">Links</h3>
      <div className="flex flex-wrap gap-2">
        {projectLinks.map((link, index) => {
          const IconComponent = link.icon;
          return (
            <a
              key={index}
              href={link.url}
              target={link.external ? "_blank" : "_self"}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-accent text-sm font-medium text-foreground hover:text-accent-foreground transition-colors group"
            >
              <IconComponent className="h-3.5 w-3.5" />
              {link.title}
              {link.external && (
                <ExternalLink className="h-3 w-3 opacity-60" />
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}