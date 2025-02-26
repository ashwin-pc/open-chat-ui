import { Artifact, ArtifactType } from '@/components/artifacts/types';

interface ParsedResponse {
  thinking: string[];
  artifacts: Artifact[];
  cleanMessage: string;
}

export function parseArtifact(response: string): ParsedResponse {
  const result: ParsedResponse = {
    thinking: [],
    artifacts: [],
    cleanMessage: response,
  };

  const thinkingRegex = /<antThinking>([\s\S]*?)<\/antThinking>/g;
  let thinkingMatch;
  while ((thinkingMatch = thinkingRegex.exec(response)) !== null) {
    result.thinking.push(thinkingMatch[1].trim());
  }

  const artifactRegex = /<antArtifact\s+(.*?)>([\s\S]*?)<\/antArtifact>/g;
  let artifactMatch;
  while ((artifactMatch = artifactRegex.exec(response)) !== null) {
    const attributesString = artifactMatch[1];
    const content = artifactMatch[2];

    const identifier = attributesString.match(/identifier="([^"]*)"/)?.[1] || '';
    const artifactType = attributesString.match(/type="([^"]*)"/)?.[1] || '';
    const title = attributesString.match(/title="([^"]*)"/)?.[1] || '';
    const language = attributesString.match(/language="([^"]*)"/)?.[1] || null;

    // TODO set react type using artifactType as the prompt has no language for react
    result.artifacts.push({
      identifier,
      artifactType: artifactType as ArtifactType | null,
      title,
      content: content.trim(),
      codeLanguage: language || null,
    });
  }

  // Clean message by removing all ant-related tags and their content
  result.cleanMessage = response
    .replace(/<antThinking>[\s\S]*?<\/antThinking>/g, '')
    .replace(/<antArtifact\s+.*?>[\s\S]*?<\/antArtifact>/g, '')
    .trim();

  return result;
}

export const cleanStreamingTextAsMessage = (text: string): string => {
  // First remove any complete tag pairs
  let cleanedText = text.replace(/<(antArtifact|antThinking)[\s\S]*?<\/\1>/g, '');

  // Then handle any remaining opening tags by removing everything after them. This is for streaming response
  cleanedText = cleanedText.replace(/<(antArtifact|antThinking)[\s\S]*$/, '');

  return cleanedText;
};
