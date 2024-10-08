import * as React from 'react';

type JSONValue = string | number | boolean | JSONObject | JSONArray;

interface JSONObject {
  [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> {}

export type AnalyticsProperties = JSONObject;

export type AnalyticsButtonProperties = {
  link_name: string;
  link_location?: string;
} & AnalyticsProperties;

// common events
export const TrackEvents = {
  ButtonClicked: 'Button Clicked',
};

export const useTrackEvent = () => {
  /**
   * [TODO]: need analytics for the konflux-ui
   *
   * chrome analytics were used with consoleDot architecture
   */
  const analytics = React.useMemo(
    () => ({ track: (event: string, properties: AnalyticsProperties) => ({ event, properties }) }),
    [],
  );
  return React.useCallback(
    (event: string, properties: AnalyticsProperties) => {
      if (process.env.NODE_ENV !== 'development') {
        analytics.track(event, { current_path: window.location.pathname, ...properties });
      } else {
        // eslint-disable-next-line no-console
        console.log('analytics.track', event, properties);
      }
    },
    [analytics],
  );
};
