import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageSection,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { CloseIcon } from '@patternfly/react-icons/dist/esm/icons/close-icon';
import classnames from 'classnames';
import { useLocalStorage } from '../../shared/hooks/useLocalStorage';
import './GettingStartedCard.scss';

type GettingStartedCardProps = {
  imgClassName?: string;
  localStorageKey: string;
  title: string;
  imgSrc?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  imgAlt?: string;
  isLight?: boolean;
};

const LOCAL_STORAGE_KEY = 'getting-started-card';

export const GettingStartedCard: React.FC<React.PropsWithChildren<GettingStartedCardProps>> = ({
  imgClassName,
  localStorageKey,
  title,
  imgSrc,
  imgAlt,
  isLight,
  children,
}) => {
  const [storageKeys, setStorageKeys] = useLocalStorage<{ [key: string]: boolean }>(
    LOCAL_STORAGE_KEY,
  );

  const keys = storageKeys && typeof storageKeys === 'object' ? storageKeys : {};
  const isDismissed = keys[localStorageKey];
  const SvgIcon = imgSrc;

  return (
    !isDismissed && (
      <PageSection variant={isLight ? 'light' : 'default'}>
        <Card>
          <Split>
            {imgSrc && (
              <SplitItem
                className={classnames('pf-v5-u-min-width getting-started-card__img', imgClassName)}
              >
                <SvgIcon aria-label={imgAlt} role="img" />
              </SplitItem>
            )}
            <SplitItem isFilled>
              <CardHeader
                actions={{
                  actions: (
                    <>
                      <Button
                        variant="plain"
                        aria-label="Hide card"
                        onClick={() => setStorageKeys({ ...keys, [localStorageKey]: true })}
                      >
                        <CloseIcon />
                      </Button>
                    </>
                  ),
                  hasNoOffset: false,
                  className: undefined,
                }}
              >
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardBody>{children}</CardBody>
            </SplitItem>
          </Split>
        </Card>
      </PageSection>
    )
  );
};
