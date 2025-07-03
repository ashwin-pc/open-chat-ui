import { Artifact, ArtifactType } from '@/components/artifacts/types';

interface ParsedResponse {
  thinking: string[];
  artifacts: Artifact[];
  cleanMessage: string;
  hasStreamingArtifacts: boolean;
}

export function parseArtifact(response: string): ParsedResponse {
  const result: ParsedResponse = {
    thinking: [],
    artifacts: [],
    cleanMessage: response,
    hasStreamingArtifacts: false,
  };

  const thinkingRegex = /<antThinking>([\s\S]*?)<\/antThinking>/g;
  let thinkingMatch;
  while ((thinkingMatch = thinkingRegex.exec(response)) !== null) {
    result.thinking.push(thinkingMatch[1].trim());
  }

  // First, try to match complete artifacts (with closing tags)
  const completeArtifactRegex = /<antArtifact\s+(.*?)>([\s\S]*?)<\/antArtifact>/g;
  let completeMatch;
  while ((completeMatch = completeArtifactRegex.exec(response)) !== null) {
    const attributesString = completeMatch[1];
    const content = completeMatch[2];

    const identifier = attributesString.match(/identifier="([^"]*)"/)?.[1] || '';
    const artifactType = attributesString.match(/type="([^"]*)"/)?.[1] || '';
    const title = attributesString.match(/title="([^"]*)"/)?.[1] || '';
    const language = attributesString.match(/language="([^"]*)"/)?.[1] || null;

    result.artifacts.push({
      identifier,
      artifactType: artifactType as ArtifactType | null,
      title,
      content: content.trim(),
      codeLanguage: language || null,
      isStreaming: false,
    });
  }

  // If no complete artifacts found, try to match partial artifacts (streaming)
  if (result.artifacts.length === 0) {
    const partialArtifactRegex = /<antArtifact\s+(.*?)>([\s\S]*?)$/g;
    let partialMatch;
    while ((partialMatch = partialArtifactRegex.exec(response)) !== null) {
      const attributesString = partialMatch[1];
      const content = partialMatch[2];

      const identifier = attributesString.match(/identifier="([^"]*)"/)?.[1] || '';
      const artifactType = attributesString.match(/type="([^"]*)"/)?.[1] || '';
      const title = attributesString.match(/title="([^"]*)"/)?.[1] || '';
      const language = attributesString.match(/language="([^"]*)"/)?.[1] || null;

      result.artifacts.push({
        identifier,
        artifactType: artifactType as ArtifactType | null,
        title,
        content: content.trim(),
        codeLanguage: language || null,
        isStreaming: true,
      });

      result.hasStreamingArtifacts = true;
    }
  }

  // Clean message by removing all ant-related tags and their content
  result.cleanMessage = response
    .replace(/<antThinking>[\s\S]*?<\/antThinking>/g, '')
    .replace(/<antArtifact\s+.*?>[\s\S]*?<\/antArtifact>/g, '') // Remove complete artifacts
    .replace(/<antArtifact[\s\S]*$/g, '') // Remove partial artifacts (streaming)
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
