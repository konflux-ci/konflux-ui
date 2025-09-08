declare module '*/overview/*.svg' {
  import { FC, SVGProps } from 'react';
  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.svg' {
  const value: any;
  export = value;
}
declare module '*.png' {
  const value: any;
  export = value;
}
