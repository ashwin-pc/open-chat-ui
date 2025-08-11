import { parseArtifact } from './artifact-parser';
import { ARTIFACT_TYPES } from './types';

describe('React App Artifacts', () => {
  describe('parseArtifact for React Apps', () => {
    test('should parse React app artifact correctly', () => {
      const input = `Here's a React todo app:

<antArtifact identifier="react-todo-app" type="application/vnd.ant.react-app" title="Todo App">
function App() {
  const [todos, setTodos] = useState([]);
  return <div>Todo App</div>;
}
</antArtifact>

This creates an interactive todo application.`;

      const result = parseArtifact(input);

      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0]).toEqual({
        identifier: 'react-todo-app',
        artifactType: ARTIFACT_TYPES.REACT_APP,
        title: 'Todo App',
        content: `function App() {
  const [todos, setTodos] = useState([]);
  return <div>Todo App</div>;
}`,
        codeLanguage: null,
        isStreaming: false,
      });
      expect(result.cleanMessage).toBe("Here's a React todo app:\n\n\n\nThis creates an interactive todo application.");
    });

    test('should handle React app with complex component structure', () => {
      const input = `<antArtifact identifier="calculator-app" type="application/vnd.ant.react-app" title="Calculator App">
function App() {
  const [display, setDisplay] = useState('0');
  const [operator, setOperator] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);

  const handleNumber = (num) => {
    setDisplay(display === '0' ? num : display + num);
  };

  const handleOperator = (nextOperator) => {
    setOperator(nextOperator);
    setPreviousValue(display);
    setDisplay('0');
  };

  const calculate = () => {
    const prev = parseFloat(previousValue);
    const current = parseFloat(display);
    
    if (operator === '+') return prev + current;
    if (operator === '-') return prev - current;
    if (operator === '*') return prev * current;
    if (operator === '/') return prev / current;
    return current;
  };

  const handleCalculate = () => {
    const result = calculate();
    setDisplay(String(result));
    setOperator(null);
    setPreviousValue(null);
  };

  return (
    <div className="max-w-xs mx-auto mt-8 p-4 bg-gray-100 rounded-lg">
      <div className="bg-black text-white p-4 rounded mb-4 text-right text-2xl">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => handleNumber('1')} className="p-4 bg-white rounded">1</button>
        <button onClick={() => handleNumber('2')} className="p-4 bg-white rounded">2</button>
        <button onClick={() => handleOperator('+')} className="p-4 bg-blue-500 text-white rounded">+</button>
        <button onClick={handleCalculate} className="p-4 bg-green-500 text-white rounded">=</button>
      </div>
    </div>
  );
}
</antArtifact>`;

      const result = parseArtifact(input);

      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].identifier).toBe('calculator-app');
      expect(result.artifacts[0].artifactType).toBe(ARTIFACT_TYPES.REACT_APP);
      expect(result.artifacts[0].title).toBe('Calculator App');
      expect(result.artifacts[0].content).toContain('function App()');
      expect(result.artifacts[0].content).toContain('useState');
      expect(result.artifacts[0].content).toContain('className=');
    });

    test('should handle multiple React app artifacts', () => {
      const input = `Here are two apps:

<antArtifact identifier="app1" type="application/vnd.ant.react-app" title="First App">
function App() {
  return <div>First App</div>;
}
</antArtifact>

And another one:

<antArtifact identifier="app2" type="application/vnd.ant.react-app" title="Second App">
function App() {
  return <div>Second App</div>;
}
</antArtifact>`;

      const result = parseArtifact(input);

      expect(result.artifacts).toHaveLength(2);
      expect(result.artifacts[0].identifier).toBe('app1');
      expect(result.artifacts[0].title).toBe('First App');
      expect(result.artifacts[1].identifier).toBe('app2');
      expect(result.artifacts[1].title).toBe('Second App');
      expect(result.artifacts[0].artifactType).toBe(ARTIFACT_TYPES.REACT_APP);
      expect(result.artifacts[1].artifactType).toBe(ARTIFACT_TYPES.REACT_APP);
    });

    test('should handle React app with hooks and state management', () => {
      const input = `<antArtifact identifier="counter-app" type="application/vnd.ant.react-app" title="Counter App">
function App() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(prev => [...prev, count]);
  }, [count]);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const reset = () => {
    setCount(0);
    setHistory([]);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Counter: {count}</h1>
      <div className="space-x-2 mb-4">
        <button onClick={increment} className="px-4 py-2 bg-blue-500 text-white rounded">+</button>
        <button onClick={decrement} className="px-4 py-2 bg-red-500 text-white rounded">-</button>
        <button onClick={reset} className="px-4 py-2 bg-gray-500 text-white rounded">Reset</button>
      </div>
      <div className="text-sm text-gray-600">
        History: {history.join(', ')}
      </div>
    </div>
  );
}
</antArtifact>`;

      const result = parseArtifact(input);

      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].content).toContain('useState');
      expect(result.artifacts[0].content).toContain('useEffect');
      expect(result.artifacts[0].content).toContain('useCallback');
      expect(result.artifacts[0].content).toContain('className=');
    });
  });

  describe('ARTIFACT_TYPES', () => {
    test('should include REACT_APP type', () => {
      expect(ARTIFACT_TYPES.REACT_APP).toBe('application/vnd.ant.react-app');
    });

    test('should have unique artifact type values', () => {
      const values = Object.values(ARTIFACT_TYPES);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });
});
