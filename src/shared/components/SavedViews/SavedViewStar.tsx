import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Popover,
  TextInput,
} from '@patternfly/react-core';
import { OutlinedStarIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-star-icon';
import { StarIcon } from '@patternfly/react-icons/dist/esm/icons/star-icon';
import { parseAsString, useQueryState } from 'nuqs';
import { SavedView } from './types';
import { useSavedViews } from './useSavedViews';

type SavedViewStarProps = {
  resourceKey: string;
  columnKeyPrefix: string;
  currentColumnStateKey: string;
  isFiltered: boolean;
  activeSavedView: SavedView | undefined;
};

export const SavedViewStar: React.FC<SavedViewStarProps> = ({
  resourceKey,
  columnKeyPrefix,
  currentColumnStateKey,
  isFiltered,
  activeSavedView,
}) => {
  const { saveView, updateView } = useSavedViews({
    resourceKey,
    columnKeyPrefix,
    routePath: '',
  });
  const [, setViewParam] = useQueryState('view', parseAsString);

  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [showSaveAs, setShowSaveAs] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  if (!isFiltered && !activeSavedView) {
    return null;
  }

  const getSearchParams = (): string => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('view');
    return currentParams.toString();
  };

  const handleSaveNew = () => {
    const savedSlug = saveView({
      slug: slug || undefined,
      label: name,
      searchParams: getSearchParams(),
      currentColumnStateKey,
    });
    void setViewParam(savedSlug);
    setName('');
    setSlug('');
    setShowSaveAs(false);
    setIsOpen(false);
  };

  const handleUpdate = () => {
    if (activeSavedView) {
      updateView(activeSavedView.slug, {
        searchParams: getSearchParams(),
        currentColumnStateKey,
      });
      setIsOpen(false);
    }
  };

  const handleSaveAsClick = () => {
    setShowSaveAs(true);
  };

  const bodyContent = () => {
    if (activeSavedView && !showSaveAs) {
      return null;
    }
    return (
      <Form>
        <FormGroup label="Name" isRequired fieldId="saved-view-name">
          <TextInput
            id="saved-view-name"
            data-test="saved-view-name-input"
            value={name}
            onChange={(_e, value) => setName(value)}
            placeholder="Enter a name"
            isRequired
          />
        </FormGroup>
        <FormGroup label="Slug" fieldId="saved-view-slug">
          <TextInput
            id="saved-view-slug"
            data-test="saved-view-slug-input"
            value={slug}
            onChange={(_e, value) => setSlug(value)}
            placeholder="e.g. my-build-failures"
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>URL-safe identifier. Auto-generated if empty.</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </Form>
    );
  };

  const footerContent = () => {
    if (activeSavedView && !showSaveAs) {
      return (
        <>
          <Button
            variant={ButtonVariant.primary}
            onClick={handleUpdate}
            data-test="saved-view-save"
          >
            Save
          </Button>
          <Button variant={ButtonVariant.secondary} onClick={handleSaveAsClick}>
            Save As
          </Button>
        </>
      );
    }
    return (
      <Button
        variant={ButtonVariant.primary}
        onClick={handleSaveNew}
        isDisabled={!name.trim()}
        data-test="saved-view-save"
      >
        Save
      </Button>
    );
  };

  const icon = activeSavedView ? (
    <StarIcon data-test="saved-view-star-filled" />
  ) : (
    <OutlinedStarIcon data-test="saved-view-star-outline" />
  );

  return (
    <Popover
      aria-label="Save view"
      isVisible={isOpen}
      minWidth="350px"
      shouldOpen={() => {
        setShowSaveAs(false);
        setName('');
        setSlug('');
        setIsOpen(true);
      }}
      shouldClose={() => {
        setIsOpen(false);
        setShowSaveAs(false);
        setName('');
        setSlug('');
      }}
      headerContent="Save view"
      bodyContent={bodyContent()}
      footerContent={footerContent()}
    >
      <Button variant={ButtonVariant.plain} aria-label="Save view" data-test="saved-view-star-btn">
        {icon}
      </Button>
    </Popover>
  );
};
