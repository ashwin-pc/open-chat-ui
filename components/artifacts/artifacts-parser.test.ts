import { cleanStreamingTextAsMessage } from 'open-chat-ui/components/artifacts/artifact-parser';

describe('cleanStreamingTextAsMessage', () => {
  test('should remove complete antThinking tags and their content', () => {
    const input = 'Hello <antThinking>some text</antThinking> world';
    expect(cleanStreamingTextAsMessage(input)).toBe('Hello  world');
  });

  test('should remove complete antArtifact tags and their content', () => {
    const input = 'Hello <antArtifact>some text</antArtifact> world';
    expect(cleanStreamingTextAsMessage(input)).toBe('Hello  world');
  });

  test('should remove multiple complete tags and their content', () => {
    const input = 'Hello <antThinking>think</antThinking> More <antArtifact>art</antArtifact> text';
    expect(cleanStreamingTextAsMessage(input)).toBe('Hello  More  text');
  });

  test('should remove everything after incomplete antThinking tag (streaming case)', () => {
    const input = 'Hello <antThinking>streaming response';
    expect(cleanStreamingTextAsMessage(input)).toBe('Hello ');
  });

  test('should handle mixed complete and incomplete tags', () => {
    const input = 'Hello <antThinking>complete</antThinking> More <antArtifact>streaming';
    expect(cleanStreamingTextAsMessage(input)).toBe('Hello  More ');
  });

  test('should return original text when no tags present', () => {
    const input = 'Hello world';
    expect(cleanStreamingTextAsMessage(input)).toBe('Hello world');
  });

  test('should handle empty string', () => {
    expect(cleanStreamingTextAsMessage('')).toBe('');
  });
});
