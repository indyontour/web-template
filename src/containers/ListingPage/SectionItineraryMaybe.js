import React from 'react';
import classNames from 'classnames';

// Import util modules
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { getDestinationSuggestions } from '../../util/destinations';

// Import shared components
import { Heading, IconLocation } from '../../components';

// Import modules from this directory
import css from './ListingPage.module.css';

const DESTINATION_KEY = 'destination';

// Label of the listing's destination option from the Console listing field config, e.g.
// "Salad Dai Waterfall - Nakhon Nayok / 2 hrs.", or null if it can't be found.
const getDestinationLabel = (listingFieldConfigs, destination) => {
  const fieldConfig = listingFieldConfigs?.find(config => config?.key === DESTINATION_KEY);
  const option = fieldConfig?.enumOptions?.find(o => `${o.option}` === `${destination}`);
  return option?.label || null;
};

/**
 * beaway: the plan for the day for the listing's destination (publicData.destination), shown as
 * a card with a numbered timeline. The steps come from src/config/destinationContent.js, so every
 * listing to the same destination shows the same plan; the host's own details stay in the
 * description. Renders nothing if the listing has no destination or it isn't configured.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Object} [props.publicData] - The listing's public data
 * @param {Array<Object>} [props.listingFieldConfigs] - Listing field configs, used for the destination's label
 * @returns {JSX.Element|null} itinerary section
 */
const SectionItineraryMaybe = props => {
  const { className, rootClassName, publicData, listingFieldConfigs } = props;
  const intl = useIntl();
  const destination = publicData?.[DESTINATION_KEY];
  const suggestions = getDestinationSuggestions(destination, intl.locale);
  const steps = suggestions?.steps || [];

  if (steps.length === 0) {
    return null;
  }

  const destinationLabel = getDestinationLabel(listingFieldConfigs, destination);
  const classes = classNames(rootClassName || css.sectionItinerary, className);
  return (
    <section className={classes} id="listing-itinerary">
      <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
        <FormattedMessage id="ListingPage.itineraryTitle" />
      </Heading>
      <div className={css.itineraryCard}>
        {destinationLabel ? (
          <p className={css.itineraryDestination}>
            <IconLocation rootClassName={css.itineraryDestinationIcon} />
            <span>{destinationLabel}</span>
          </p>
        ) : null}
        <ol className={css.itineraryList}>
          {steps.map((step, index) => (
            <li key={`${index}-${step}`} className={css.itineraryStep}>
              <span className={css.itineraryStepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <span className={css.itineraryStepText}>{step}</span>
            </li>
          ))}
        </ol>
        <p className={css.itineraryNote}>
          <FormattedMessage id="ListingPage.itineraryNote" />
        </p>
      </div>
    </section>
  );
};

export default SectionItineraryMaybe;
