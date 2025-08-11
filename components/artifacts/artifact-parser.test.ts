import { cleanStreamingTextAsMessage, parseArtifact } from './artifact-parser';
import { ARTIFACT_TYPES } from './types';

describe('artifact-parser', () => {
  describe('parseArtifact', () => {
    describe('complete artifacts', () => {
      test('should parse a simple code artifact', () => {
        const response = `
Here's a simple function:

<antArtifact identifier="hello-function" type="application/vnd.ant.code" title="Hello Function" language="javascript">
function hello() {
  console.log("Hello, World!");
}
</antArtifact>

This function prints a greeting.`;

        const result = parseArtifact(response);

        expect(result.artifacts).toHaveLength(1);
        expect(result.artifacts[0]).toEqual({
          identifier: 'hello-function',
          artifactType: ARTIFACT_TYPES.CODE,
          title: 'Hello Function',
          content: 'function hello() {\n  console.log("Hello, World!");\n}',
          codeLanguage: 'javascript',
          isStreaming: false,
        });
        expect(result.hasStreamingArtifacts).toBe(false);
        expect(result.cleanMessage.trim()).toBe("Here's a simple function:\n\n\n\nThis function prints a greeting.");
      });

      test('should parse a React component artifact', () => {
        const response = `
I'll create a React component for you:

<antArtifact identifier="button-component" type="application/vnd.ant.react-app" title="Button Component">
import React from 'react';

const Button = ({ children, onClick }) => {
  return (
    <button onClick={onClick} className="btn">
      {children}
    </button>
  );
};

export default Button;
</antArtifact>

This is a reusable button component.`;

        const result = parseArtifact(response);

        expect(result.artifacts).toHaveLength(1);
        expect(result.artifacts[0]).toEqual({
          identifier: 'button-component',
          artifactType: ARTIFACT_TYPES.REACT_APP,
          title: 'Button Component',
          content: `import React from 'react';

const Button = ({ children, onClick }) => {
  return (
    <button onClick={onClick} className="btn">
      {children}
    </button>
  );
};

export default Button;`,
          codeLanguage: null,
          isStreaming: false,
        });
        expect(result.hasStreamingArtifacts).toBe(false);
      });

      test('should parse multiple artifacts in one response', () => {
        const response = `
Here are two functions:

<antArtifact identifier="add-function" type="application/vnd.ant.code" title="Add Function" language="javascript">
function add(a, b) {
  return a + b;
}
</antArtifact>

And here's another one:

<antArtifact identifier="multiply-function" type="application/vnd.ant.code" title="Multiply Function" language="javascript">
function multiply(a, b) {
  return a * b;
}
</antArtifact>

Both functions perform mathematical operations.`;

        const result = parseArtifact(response);

        expect(result.artifacts).toHaveLength(2);
        expect(result.artifacts[0].identifier).toBe('add-function');
        expect(result.artifacts[1].identifier).toBe('multiply-function');
        expect(result.hasStreamingArtifacts).toBe(false);
      });
    });

    describe('streaming/partial artifacts', () => {
      test('should parse partial artifact without closing tag', () => {
        const response = `
I'm creating a function for you:

<antArtifact identifier="streaming-function" type="application/vnd.ant.code" title="Streaming Function" language="javascript">
function streamingExample() {
  console.log("This is being generated...");`;

        const result = parseArtifact(response);

        expect(result.artifacts).toHaveLength(1);
        expect(result.artifacts[0]).toEqual({
          identifier: 'streaming-function',
          artifactType: ARTIFACT_TYPES.CODE,
          title: 'Streaming Function',
          content: 'function streamingExample() {\n  console.log("This is being generated...");',
          codeLanguage: 'javascript',
          isStreaming: true,
        });
        expect(result.hasStreamingArtifacts).toBe(true);
        expect(result.cleanMessage.trim()).toBe("I'm creating a function for you:");
      });

      test('should parse partial React component', () => {
        const response = `
Creating a component:

<antArtifact identifier="partial-component" type="application/vnd.ant.react-app" title="Partial Component">
import React from 'react';

const MyComponent = () => {
  return (
    <div>
      <h1>Hello`;

        const result = parseArtifact(response);

        expect(result.artifacts).toHaveLength(1);
        expect(result.artifacts[0].isStreaming).toBe(true);
        expect(result.artifacts[0].artifactType).toBe(ARTIFACT_TYPES.REACT_APP);
        expect(result.hasStreamingArtifacts).toBe(true);
      });

      test('should prioritize complete artifacts over partial ones', () => {
        const response = `
<antArtifact identifier="complete" type="application/vnd.ant.code" title="Complete" language="javascript">
function complete() {
  return "done";
}
</antArtifact>

<antArtifact identifier="partial" type="application/vnd.ant.code" title="Partial" language="javascript">
function partial() {
  return "not finished`;

        const result = parseArtifact(response);

        // Should find the complete artifact, not the partial one
        expect(result.artifacts).toHaveLength(1);
        expect(result.artifacts[0].identifier).toBe('complete');
        expect(result.artifacts[0].isStreaming).toBe(false);
        expect(result.hasStreamingArtifacts).toBe(false);
      });
    });

    describe('thinking tags', () => {
      test('should extract thinking content', () => {
        const response = `
<antThinking>
I need to create a simple function that adds two numbers.
This should be straightforward.
</antThinking>

Here's the function:

<antArtifact identifier="add-func" type="application/vnd.ant.code" title="Add Function" language="javascript">
function add(a, b) {
  return a + b;
}
</antArtifact>`;

        const result = parseArtifact(response);

        expect(result.thinking).toHaveLength(1);
        expect(result.thinking[0]).toBe(
          'I need to create a simple function that adds two numbers.\nThis should be straightforward.',
        );
        expect(result.artifacts).toHaveLength(1);
      });
    });

    describe('edge cases', () => {
      test('should handle empty response', () => {
        const result = parseArtifact('');

        expect(result.artifacts).toHaveLength(0);
        expect(result.thinking).toHaveLength(0);
        expect(result.hasStreamingArtifacts).toBe(false);
        expect(result.cleanMessage).toBe('');
      });

      test('should handle response with no artifacts', () => {
        const response = 'This is just a regular response with no artifacts.';
        const result = parseArtifact(response);

        expect(result.artifacts).toHaveLength(0);
        expect(result.hasStreamingArtifacts).toBe(false);
        expect(result.cleanMessage).toBe(response);
      });

      test('should handle artifacts with missing attributes', () => {
        const response = `
<antArtifact identifier="minimal" type="application/vnd.ant.code">
console.log("minimal");
</antArtifact>`;

        const result = parseArtifact(response);

        expect(result.artifacts).toHaveLength(1);
        expect(result.artifacts[0]).toEqual({
          identifier: 'minimal',
          artifactType: ARTIFACT_TYPES.CODE,
          title: '',
          content: 'console.log("minimal");',
          codeLanguage: null,
          isStreaming: false,
        });
      });
    });
  });

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

    // Tests for legacy <think> tag support (regression prevention)
    test('should remove complete legacy think tags and their content', () => {
      const input = 'Hello <think>some thinking</think> world';
      expect(cleanStreamingTextAsMessage(input)).toBe('Hello  world');
    });

    test('should remove everything after incomplete legacy think tag (streaming case)', () => {
      const input = 'Hello <think>streaming thinking response';
      expect(cleanStreamingTextAsMessage(input)).toBe('Hello ');
    });

    test('should handle mixed legacy think and antThinking tags', () => {
      const input = 'Hello <think>legacy</think> More <antThinking>modern</antThinking> text';
      expect(cleanStreamingTextAsMessage(input)).toBe('Hello  More  text');
    });

    test('should handle multiple legacy think tags', () => {
      const input = 'Start <think>first</think> Middle <think>second</think> End';
      expect(cleanStreamingTextAsMessage(input)).toBe('Start  Middle  End');
    });

    test('should handle nested-like content within think tags', () => {
      const input = 'Text <think>I need to think about <antArtifact>nested content</antArtifact></think> more';
      expect(cleanStreamingTextAsMessage(input)).toBe('Text  more');
    });

    test('should handle mixed complete and incomplete think tags', () => {
      const input = 'Hello <think>complete</think> More <think>streaming';
      expect(cleanStreamingTextAsMessage(input)).toBe('Hello  More ');
    });
  });
});
