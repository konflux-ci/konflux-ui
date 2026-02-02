import { saveAs } from 'file-saver';
import { dump } from 'js-yaml';
import { TaskRunKind } from '~/types';
import { downloadYaml } from '../common-utils';

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
