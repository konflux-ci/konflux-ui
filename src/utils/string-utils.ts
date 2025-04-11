export const formatToKebabCase = (name: string): string =>
  name.replace(
    /([a-z])([A-Z])|_|(\d+)|(^-+|-+$)|(-+)/g,
    (_, lower, upper, digit, edge, multiple) =>
      lower && upper ? `${lower}-${upper}` : digit ? `-${digit}` : edge ? '' : multiple ? '-' : '-',
  );
