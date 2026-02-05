import { saveAs } from 'file-saver';
import { dump } from 'js-yaml';
import { TaskRunKind } from '../../types';
import { downloadYaml, parseBoolean, parseNumber } from '../common-utils';

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

// Mock js-yaml
jest.mock('js-yaml', () => ({
  dump: jest.fn((obj) => JSON.stringify(obj)),
}));

const mockSaveAs = saveAs as jest.Mock;
const mockDump = dump as jest.Mock;

describe('downloadYaml', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should download YAML file with correct filename when taskRun has metadata.name', () => {
    const mockTaskRun: TaskRunKind = {
      apiVersion: 'tekton.dev/v1',
      kind: 'TaskRun',
      metadata: {
        name: 'test-taskrun-123',
        namespace: 'test-ns',
      },
      spec: {
        taskRef: {
          name: 'test-task',
        },
      },
    };

    downloadYaml(mockTaskRun);

    expect(mockDump).toHaveBeenCalledWith(mockTaskRun);
    expect(mockSaveAs).toHaveBeenCalledTimes(1);

    const [blob, filename] = mockSaveAs.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/yaml;charset=utf-8');
    expect(filename).toBe('test-taskrun-123.yaml');
  });

  it('should use fallback filename when taskRun metadata.name is missing', () => {
    const mockTaskRun: TaskRunKind = {
      apiVersion: 'tekton.dev/v1',
      kind: 'TaskRun',
      metadata: {
        namespace: 'test-ns',
      },
      spec: {
        taskRef: {
          name: 'test-task',
        },
      },
    };

    downloadYaml(mockTaskRun);

    expect(mockDump).toHaveBeenCalledWith(mockTaskRun);
    expect(mockSaveAs).toHaveBeenCalledTimes(1);

    const [blob, filename] = mockSaveAs.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(filename).toBe('resource.yaml');
  });

  it('should use fallback filename when taskRun metadata is missing', () => {
    const mockTaskRun: TaskRunKind = {
      apiVersion: 'tekton.dev/v1',
      kind: 'TaskRun',
      spec: {
        taskRef: {
          name: 'test-task',
        },
      },
    } as TaskRunKind;

    downloadYaml(mockTaskRun);

    expect(mockDump).toHaveBeenCalledWith(mockTaskRun);
    expect(mockSaveAs).toHaveBeenCalledTimes(1);

    const [blob, filename] = mockSaveAs.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(filename).toBe('resource.yaml');
  });

  it('should return early and not call saveAs when taskRun is null', () => {
    downloadYaml(null as unknown as TaskRunKind);

    expect(mockDump).not.toHaveBeenCalled();
    expect(mockSaveAs).not.toHaveBeenCalled();
  });

  it('should return early and not call saveAs when taskRun is undefined', () => {
    downloadYaml(undefined as unknown as TaskRunKind);

    expect(mockDump).not.toHaveBeenCalled();
    expect(mockSaveAs).not.toHaveBeenCalled();
  });

  it('should create Blob with correct YAML content', () => {
    const mockTaskRun: TaskRunKind = {
      apiVersion: 'tekton.dev/v1',
      kind: 'TaskRun',
      metadata: {
        name: 'test-taskrun',
        namespace: 'test-ns',
      },
      spec: {
        taskRef: {
          name: 'test-task',
        },
      },
    };

    const mockYamlContent = 'apiVersion: tekton.dev/v1\nkind: TaskRun\n';
    mockDump.mockReturnValue(mockYamlContent);

    downloadYaml(mockTaskRun);

    const [blob] = mockSaveAs.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/yaml;charset=utf-8');

    // Verify blob content by reading it
    const reader = new FileReader();
    const readPromise = new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
    });
    reader.readAsText(blob as Blob);
    return readPromise.then((content) => {
      expect(content).toBe(mockYamlContent);
    });
  });
});

describe('parseBoolean', () => {
  it('should return defaultValue when value is undefined', () => {
    expect(parseBoolean(undefined, true)).toBe(true);
    expect(parseBoolean(undefined, false)).toBe(false);
  });

  it('should return defaultValue when value is empty string', () => {
    expect(parseBoolean('', true)).toBe(true);
    expect(parseBoolean('', false)).toBe(false);
  });

  it('should return true for "true" (case insensitive)', () => {
    expect(parseBoolean('true', false)).toBe(true);
    expect(parseBoolean('TRUE', false)).toBe(true);
    expect(parseBoolean('True', false)).toBe(true);
    expect(parseBoolean('TrUe', false)).toBe(true);
  });

  it('should return false for "false"', () => {
    expect(parseBoolean('false', true)).toBe(false);
    expect(parseBoolean('FALSE', true)).toBe(false);
  });

  it('should return false for any non-"true" string', () => {
    expect(parseBoolean('yes', true)).toBe(false);
    expect(parseBoolean('1', true)).toBe(false);
    expect(parseBoolean('invalid', true)).toBe(false);
  });
});

describe('parseNumber', () => {
  it('should return defaultValue when value is undefined', () => {
    expect(parseNumber(undefined, 10)).toBe(10);
    expect(parseNumber(undefined, 0)).toBe(0);
  });

  it('should return defaultValue when value is empty string', () => {
    expect(parseNumber('', 5.5)).toBe(5.5);
  });

  it('should parse valid integer strings', () => {
    expect(parseNumber('42', 0)).toBe(42);
    expect(parseNumber('0', 10)).toBe(0);
    expect(parseNumber('-5', 0)).toBe(-5);
  });

  it('should parse valid float strings', () => {
    expect(parseNumber('3.14', 0)).toBe(3.14);
    expect(parseNumber('0.5', 0)).toBe(0.5);
    expect(parseNumber('-2.5', 0)).toBe(-2.5);
  });

  it('should return defaultValue for invalid number strings', () => {
    expect(parseNumber('invalid', 99)).toBe(99);
    expect(parseNumber('abc123', 1)).toBe(1);
    expect(parseNumber('NaN', 0)).toBe(0);
  });
});
