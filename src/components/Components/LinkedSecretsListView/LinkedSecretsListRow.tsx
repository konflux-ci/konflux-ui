import { Button, Flex, Label, Text, TextVariants } from '@patternfly/react-core';
import { RowFunctionArgs, TableData } from '../../../shared';
import { SecretKind } from '../../../types';
import { linkedSecretsTableColumnClasses } from './LinkedSecretsListHeader';

import './LinkedSecretsListView.scss';

export const LinkedSecretsListRow: React.FC<RowFunctionArgs<SecretKind>> = ({ obj: secret }) => {
  return (
    <>
      <TableData
        className={linkedSecretsTableColumnClasses.secretName}
        data-test="linked-secrets-list-item"
      >
        <Text component={TextVariants.p}>{secret.metadata.name}</Text>
      </TableData>

      <TableData className={linkedSecretsTableColumnClasses.type}>
        <Text component={TextVariants.p}>{secret.type}</Text>
      </TableData>

      <TableData className={linkedSecretsTableColumnClasses.labels}>
        {secret.metadata.labels ? (
          Object.keys(secret.metadata.labels ?? {}).map((key) => (
            <Label
              key={key}
              className="linked-secrets-list-view__label"
            >{`${key}=${secret.metadata.labels[key]}`}</Label>
          ))
        ) : (
          <Text component={TextVariants.p}> - </Text>
        )}
      </TableData>

      <TableData className={linkedSecretsTableColumnClasses.actions}>
        {/* TODO: onClick logic will be implemented in another ticket*/}
        {/* eslint-disable-next-line no-alert */}
        <Button variant="secondary" onClick={() => alert('TODO')}>
          Unlink
        </Button>
      </TableData>

      <TableData className={linkedSecretsTableColumnClasses.kebab}>
        <Flex direction={{ default: 'column' }} />
      </TableData>
    </>
  );
};
