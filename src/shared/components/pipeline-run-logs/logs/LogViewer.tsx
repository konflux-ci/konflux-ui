import React from 'react';
import { Toolbar, ToolbarContent } from '@patternfly/react-core';
import {
  LogViewer as PatternFlyLogViewer,
  LogViewerProps,
  LogViewerSearch,
} from '@patternfly/react-log-viewer';

export type Props = LogViewerProps & {
  showSearch?: boolean;
  data: string;
  autoScroll?: boolean;
};

const LogViewer: React.FC<Props> = ({ showSearch = true, autoScroll, data, ...props }) => {
  const scrolledRow = React.useMemo(
    () => (autoScroll ? data.split('\n').length : 0),
    [autoScroll, data],
  );
  return (
    <PatternFlyLogViewer
      {...props}
      hasLineNumbers={false}
      data={data}
      theme="dark"
      scrollToRow={scrolledRow}
      toolbar={
        <Toolbar>
          <ToolbarContent>
            {showSearch && <LogViewerSearch placeholder="Search" minSearchChars={0} />}
          </ToolbarContent>
        </Toolbar>
      }
    />
  );
};

export default LogViewer;
