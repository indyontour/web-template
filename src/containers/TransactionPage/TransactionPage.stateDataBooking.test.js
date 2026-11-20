import { createTransaction, createUser, createListing, fakeIntl } from '../../util/testData';
import { getProcess } from '../../transactions/transaction';

import { getStateData } from './TransactionPage.stateData';

const process = getProcess('default-booking');
const { transitions } = process;

const getBookingStateData = (lastTransition, transactionRole) => {
  const transaction = createTransaction({
    id: 'tx-booking',
    processName: 'default-booking',
    lastTransition,
    customer: createUser('customer'),
    provider: createUser('provider'),
    listing: createListing('listing'),
  });
  return getStateData(
    {
      transaction,
      transactionRole,
      intl: fakeIntl,
      transitionInProgress: null,
      transitionError: null,
      onTransition: () => {},
      sendReviewInProgress: false,
      sendReviewError: null,
      onOpenReviewModal: () => {},
    },
    process
  );
};

describe('TransactionPage state data for default-booking (beaway)', () => {
  it('shows a "Withdraw request" button to the traveler while the request is pending', () => {
    const stateData = getBookingStateData(transitions.REQUEST_PAYMENT, 'customer');
    expect(stateData.processState).toEqual('preauthorized');
    expect(stateData.showActionButtons).toBe(true);
    expect(stateData.secondaryButtonProps.buttonText).toEqual(
      'TransactionPage.default-booking.customer.transition-customer-withdraw-request.actionButton'
    );
    expect(stateData.primaryButtonProps).toBeUndefined();
  });

  it('still shows Accept and Decline to the host while the request is pending', () => {
    const stateData = getBookingStateData(transitions.REQUEST_PAYMENT, 'provider');
    expect(stateData.primaryButtonProps.buttonText).toContain('transition-accept');
    expect(stateData.secondaryButtonProps.buttonText).toContain('transition-decline');
  });

  it('shows no action buttons after the traveler withdrew the request', () => {
    const stateData = getBookingStateData(transitions.CUSTOMER_WITHDRAW_REQUEST, 'customer');
    expect(stateData.processState).toEqual('withdrawn');
    expect(stateData.showActionButtons).toBeFalsy();
  });
});
