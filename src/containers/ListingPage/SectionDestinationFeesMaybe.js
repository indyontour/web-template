import React from 'react';
import classNames from 'classnames';

// Import util modules
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { formatFeeValue, getDestinationFees } from '../../util/destinations';

// Import shared components
import { Heading } from '../../components';

// Import modules from this directory
import css from './ListingPage.module.css';

const FEE_ROWS = [
  { type: 'entrance', labelId: 'DestinationFees.entranceLabel' },
  { type: 'guide', labelId: 'DestinationFees.guideLabel' },
];

/**
 * beaway: fees travelers pay per person on the day at the listing's destination (entrance fee and,
 * where required, a local guide fee), with separate Thai and foreign visitor prices. The amounts
 * come from Marketplace texts in Console (see getDestinationFees in util/destinations.js), so they
 * can change without a deploy. Renders nothing if the destination has no fees set.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Object} [props.publicData] - The listing's public data
 * @returns {JSX.Element|null} fees section
 */
const SectionDestinationFeesMaybe = props => {
  const { className, rootClassName, publicData } = props;
  const intl = useIntl();
  const fees = getDestinationFees(intl.messages, publicData?.destination);

  if (!fees) {
    return null;
  }

  const classes = classNames(rootClassName || css.sectionDestinationFees, className);
  return (
    <section className={classes} id="listing-destination-fees">
      <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
        <FormattedMessage id="ListingPage.destinationFeesTitle" />
      </Heading>
      <div className={css.itineraryCard}>
        <dl className={css.feeList}>
          {FEE_ROWS.filter(row => fees[row.type]).map(row => {
            const { thai, foreign } = fees[row.type];
            return (
              <div key={row.type} className={css.feeRow}>
                <dt className={css.feeLabel}>
                  <FormattedMessage id={row.labelId} />
                </dt>
                <dd className={css.feeAmounts}>
                  {thai ? (
                    <span className={css.feeAmount}>
                      <span className={css.feeVisitor}>
                        <FormattedMessage id="DestinationFees.thaiVisitors" />
                      </span>
                      <span className={css.feePrice}>{formatFeeValue(intl, thai)}</span>
                    </span>
                  ) : null}
                  {foreign ? (
                    <span className={css.feeAmount}>
                      <span className={css.feeVisitor}>
                        <FormattedMessage id="DestinationFees.foreignVisitors" />
                      </span>
                      <span className={css.feePrice}>{formatFeeValue(intl, foreign)}</span>
                    </span>
                  ) : null}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className={css.itineraryNote}>
          <FormattedMessage id="ListingPage.destinationFeesNote" />
        </p>
      </div>
    </section>
  );
};

export default SectionDestinationFeesMaybe;
