declare module 'cronstrue' {
  interface Options {
    verbose?: boolean;
    dayOfWeekStartIndexZero?: boolean;
    use24HourTimeFormat?: boolean;
    throwExceptionOnParseError?: boolean;
  }

  export function toString(cronExpression: string, options?: Options): string;
  export default { toString };
} 