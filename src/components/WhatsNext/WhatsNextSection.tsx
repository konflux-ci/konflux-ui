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
import { CloseButton } from '../../shared';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import './WhatsNextSection.scss';

export type WhatsNextItem = {
  title: string;
  description: string;
  icon: string;
  helpId?: string;
  helpLink?: string;
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

const WhatsNextSection: React.FunctionComponent<React.PropsWithChildren<WhatsNextSectionProps>> = ({
  whatsNextItems,
}) => {
  const [whatsNextData, setWhatsNextData] = React.useState(whatsNextItems);

  const handleCardDismissal = (title: string) => {
    setWhatsNextData((prev) => prev.filter((item) => item.title !== title));
    let dismissedCards: string[] = [];
    if (localStorage.getItem('dismissedCards') !== null)
      dismissedCards = JSON.parse(localStorage.getItem('dismissedCards'));
    localStorage.setItem('dismissedCards', JSON.stringify([title, ...dismissedCards]));
  };

  React.useEffect(() => {
    let dismissedCards: string[] = [];
    if (localStorage.getItem('dismissedCards') !== null)
      dismissedCards = JSON.parse(localStorage.getItem('dismissedCards'));
    if (dismissedCards.length === 0) setWhatsNextData(whatsNextItems);
    else {
      const list = whatsNextItems.filter((item) => {
        return !dismissedCards.find((title) => title === item.title);
      });
      setWhatsNextData(list);
    }
  }, [whatsNextItems]);

  return (
    <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
      <Title size="lg" headingLevel="h3" className="pf-v5-u-mt-lg pf-v5-u-mb-sm">
        {whatsNextData?.length > 0 && "What's next?"}
      </Title>
      {whatsNextData.map((item) => (
        <Card className="whats-next-card" key={item.title} isFlat>
          <SplitItem>
            <img src={item.icon} alt={item.title} className="whats-next-card__icon" />
          </SplitItem>
          <SplitItem className="whats-next-card__content" isFilled>
            <Title headingLevel="h4">{item.title}</Title>
            <HelperText>{item.description}</HelperText>
          </SplitItem>
          <SplitItem className="whats-next-card__cta" data-test={item.cta.testId}>
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
            {item.helpLink && (
              <ExternalLink href={item.helpLink} isInline={false}>
                Learn more
              </ExternalLink>
            )}
            <CloseButton
              dataTestID="close-button"
              onClick={() => {
                handleCardDismissal(item.title);
              }}
            />
          </SplitItem>
        </Card>
      ))}
    </PageSection>
  );
};

export default WhatsNextSection;
