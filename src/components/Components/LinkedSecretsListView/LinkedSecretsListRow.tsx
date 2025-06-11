import { Label, Text, TextVariants } from '@patternfly/react-core';
import UnlinkSecretView from '~/components/Components/UnlinkSecret/UnlinkSecretView';
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
        <UnlinkSecretView secret={secret} />
      </TableData>
    </>
  );
};
