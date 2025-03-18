export type MockFunction = (...args: never[]) => unknown;

export type MockFunctionKeys<T> = {
  [K in keyof T]: T[K] extends MockFunction ? K : never;
}[keyof T];

export type JestMockedFunction<T extends MockFunction> = jest.Mock<ReturnType<T>, Parameters<T>>;
