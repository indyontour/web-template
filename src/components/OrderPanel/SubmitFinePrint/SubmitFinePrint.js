import React from 'react';
import { FormattedMessage } from '../../../util/reactIntl';

import css from './SubmitFinePrint.module.css';

/**
 * A component that displays the fine print for the submit button.
 * Note: this is not in use for ProductOrderForm.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.payoutDetailsWarning] - The payout details warning
 * @param {boolean} [props.isOwnListing] - Whether the listing is owned by the current user
 * @param {boolean} [props.noOnlinePayment] - beaway: booking without online payment (pay the host)
 */
const SubmitFinePrint = ({
  payoutDetailsWarning,
  isOwnListing,
  omitYouWontBeChargedMessage = false,
  noOnlinePayment = false,
}) => {
  return (
    <p className={css.finePrint}>
      {payoutDetailsWarning ? (
        payoutDetailsWarning
      ) : isOwnListing ? (
        <FormattedMessage id="OrderPanel.ownListing" />
      ) : noOnlinePayment ? (
        // beaway: own key so Console texts can't put payment wording back
        <FormattedMessage id="OrderPanel.noOnlinePaymentInfo" />
      ) : !omitYouWontBeChargedMessage ? (
        <FormattedMessage id="OrderPanel.youWontBeChargedInfo" />
      ) : null}
    </p>
  );
};

/**
 * beaway: fine print for bookings without online payment.
 *
 * @param {Object} props same as SubmitFinePrint
 * @returns {JSX.Element}
 */
export const SubmitFinePrintNoOnlinePayment = props => (
  <SubmitFinePrint {...props} noOnlinePayment />
);

export default SubmitFinePrint;
