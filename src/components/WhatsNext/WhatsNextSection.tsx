import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  HelperText,
  PageSection,
  PageSectionVariants,
  SplitItem,
  Title,
} from '@patternfly/react-core';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { CloseButton } from '../../shared';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import './WhatsNextSection.scss';

export type WhatsNextItem = {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  helpId?: string;
  noAction?: boolean;
  helpLink?: string;
  helpText?: string;
  cta?: {
    label: string;
    href?: string;
    external?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    disabledTooltip?: string;
    testId?: string;
    analytics?: React.ComponentProps<typeof ButtonWithAccessTooltip>['analytics'];
  };
};

type WhatsNextSectionProps = {
  whatsNextItems: WhatsNextItem[];
};

const DISMISSED_CARD_STORAGE_KEY = 'dismissedCards';

const WhatsNextSection: React.FunctionComponent<React.PropsWithChildren<WhatsNextSectionProps>> = ({
  whatsNextItems,
}) => {
  const [localStorageItem, setLocalStorageItem] = useLocalStorage<number[]>(
    DISMISSED_CARD_STORAGE_KEY,
  );

  const handleCardDismissal = React.useCallback(
    (id: number) => {
      let dismissedCards: number[] = [];
      if (localStorageItem !== null) dismissedCards = localStorageItem as number[];
      setLocalStorageItem([id, ...dismissedCards]);
    },
    [localStorageItem, setLocalStorageItem],
  );

  if (localStorageItem?.length === whatsNextItems.length) return null;
  return (
    <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
      <Title size="lg" headingLevel="h3" className="pf-v5-u-mt-lg pf-v5-u-mb-sm">
        What&apos;s next?
      </Title>
      {whatsNextItems.map((item) => {
        const ItemIcon = item.icon;

        return (
          !(localStorageItem as number[])?.includes(item?.id) && (
            <Card className="whats-next-card" key={item.id} isFlat>
              <SplitItem>
                <ItemIcon aria-label={item.title} role="img" className="whats-next-card__icon" />
              </SplitItem>
              <SplitItem className="whats-next-card__content" isFilled>
                <Title headingLevel="h4">{item.title}</Title>
                <HelperText>{item.description}</HelperText>
              </SplitItem>
              <SplitItem className="whats-next-card__cta" data-test={item.cta?.testId}>
                {item.cta && (
                  <ButtonWithAccessTooltip
                    {...(item.cta.onClick
                      ? { onClick: item.cta.onClick }
                      : !item.cta.external
                        ? {
                            component: (props) => <Link {...props} to={item.cta.href} />,
                          }
                        : {
                            component: 'a',
                            href: item.cta.href,
                            target: '_blank',
                            rel: 'noreferrer',
                          })}
                    isDisabled={item.cta.disabled}
                    tooltip={item.cta.disabledTooltip}
                    variant="secondary"
                    analytics={item.cta.analytics}
                  >
                    {item.cta.label}
                  </ButtonWithAccessTooltip>
                )}
                {item.helpLink && (
                  <ExternalLink href={item.helpLink} isInline={false}>
                    {item.helpText ?? 'Learn more'}
                  </ExternalLink>
                )}
                <CloseButton
                  dataTestID="close-button"
                  onClick={() => {
                    handleCardDismissal(item.id);
                  }}
                />
              </SplitItem>
            </Card>
          )
        );
      })}
    </PageSection>
  );
};

export default WhatsNextSection;
