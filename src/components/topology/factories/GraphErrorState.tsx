import * as React from 'react';
import { Alert, AlertActionCloseButton, Bullseye, Icon } from '@patternfly/react-core';
import { OutlinedEyeSlashIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-eye-slash-icon';
import { t_global_text_color_subtle as grayColor } from '@patternfly/react-tokens/dist/js/t_global_text_color_subtle';
import cx from 'classnames';

import './GraphErrorState.scss';

type GraphErrorStateProps = {
  errors: unknown[];
  fullHeight?: boolean;
};

const GraphErrorState: React.FC<React.PropsWithChildren<GraphErrorStateProps>> = ({
  errors,
  fullHeight,
}) => {
  const [closedError, setClosedError] = React.useState<number[]>([]);

  const uniqueErrors = React.useMemo(
    () =>
      errors.reduce((acc: string[], e: { message: string }): string[] => {
        if (!acc.includes(e.message)) {
          acc.push(e.message);
        }
        return acc;
      }, []) as string[],
    [errors],
  );

  if (errors.length === 0) {
    return null;
  }

  return (
    <>
      {uniqueErrors.length !== closedError.length && (
        <div className="graph-error-state__inline-errors" data-test="graph-error-state">
          {uniqueErrors.map((errMessage: string, key: number) => {
            return !closedError.includes(key) ? (
              <Alert
                key={key}
                variant="danger"
                isInline
                title={errMessage}
                data-test="error"
                actionClose={
                  <AlertActionCloseButton
                    onClose={() => {
                      setClosedError([...closedError, key]);
                    }}
                  />
                }
              />
            ) : null;
          })}
        </div>
      )}

      <Bullseye className={cx('graph-error-state', { 'm-full-height': fullHeight })}>
        <Icon iconSize="md">
          <OutlinedEyeSlashIcon color={grayColor.value} />
        </Icon>
      </Bullseye>
    </>
  );
};
export default GraphErrorState;
