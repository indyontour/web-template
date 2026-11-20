import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../transactions/transaction';

/**
 * beaway: ask "Are you sure?" before an action that can't be undone (withdraw, cancel).
 * Returns the button props with onAction wrapped in a browser confirm dialog.
 *
 * @param {Object} buttonProps props from actionButtonProps()
 * @param {string} confirmText question shown in the dialog
 * @returns {Object} button props
 */
const withConfirmation = (buttonProps, confirmText) => {
  if (!buttonProps?.onAction) {
    return buttonProps;
  }
  const { onAction } = buttonProps;
  return {
    ...buttonProps,
    onAction: () => {
      const confirmed = typeof window === 'undefined' || window.confirm(confirmText);
      if (confirmed) {
        onAction();
      }
    },
  };
};

/**
 * Get state data against booking process for TransactionPage's UI.
 * I.e. info about showing action buttons, current state etc.
 *
 * @param {*} txInfo detials about transaction
 * @param {*} processInfo  details about process
 */
export const getStateDataForBookingProcess = (txInfo, processInfo) => {
  const { transaction, transactionRole, nextTransitions, intl } = txInfo;
  const confirmText = id => (intl ? intl.formatMessage({ id }) : '');
  const isProviderBanned = transaction?.provider?.attributes?.banned;
  const isCustomerBanned = transaction?.provider?.attributes?.banned;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  const {
    processName,
    processState,
    states,
    transitions,
    isCustomer,
    actionButtonProps,
    leaveReviewProps,
  } = processInfo;

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, CUSTOMER], () => {
      const transitionNames = Array.isArray(nextTransitions)
        ? nextTransitions.map(t => t.attributes.name)
        : [];
      const requestAfterInquiry = transitions.REQUEST_PAYMENT_AFTER_INQUIRY;
      const hasCorrectNextTransition = transitionNames.includes(requestAfterInquiry);
      const showOrderPanel = !isProviderBanned && hasCorrectNextTransition;
      return { processName, processState, showOrderPanel, showDetailCardHeadings: true };
    })
    .cond([states.INQUIRY, PROVIDER], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.PREAUTHORIZED, CUSTOMER], () => {
      // beaway: the traveler can withdraw the request while waiting for the host
      const secondary = withConfirmation(
        actionButtonProps(transitions.CUSTOMER_WITHDRAW_REQUEST, CUSTOMER),
        confirmText('TransactionPage.default-booking.customer.withdrawRequest.confirm')
      );
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.PREAUTHORIZED, PROVIDER], () => {
      const primary = isCustomerBanned ? null : actionButtonProps(transitions.ACCEPT, PROVIDER);
      const secondary = isCustomerBanned ? null : actionButtonProps(transitions.DECLINE, PROVIDER);
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.ACCEPTED, CUSTOMER], () => {
      // beaway: the traveler can cancel an accepted booking until 12 hours before departure
      const secondary = withConfirmation(
        actionButtonProps(transitions.CUSTOMER_CANCEL, CUSTOMER),
        confirmText('TransactionPage.default-booking.customer.cancelBooking.confirm')
      );
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.ACCEPTED, PROVIDER], () => {
      // beaway: the host can cancel an accepted booking at any time before the trip completes
      const secondary = withConfirmation(
        actionButtonProps(transitions.PROVIDER_CANCEL, PROVIDER),
        confirmText('TransactionPage.default-booking.provider.cancelBooking.confirm')
      );
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.CANCELLATION_CLOSED, CUSTOMER], () => {
      return { processName, processState, showDetailCardHeadings: true, showExtraInfo: true };
    })
    .cond([states.CANCELLATION_CLOSED, PROVIDER], () => {
      const secondary = withConfirmation(
        actionButtonProps(transitions.PROVIDER_CANCEL_AFTER_WINDOW, PROVIDER),
        confirmText('TransactionPage.default-booking.provider.cancelBooking.confirm')
      );
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.DELIVERED, _], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsFirstLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_PROVIDER, CUSTOMER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED, _], () => {
      return { processName, processState, showDetailCardHeadings: true, showReviews: true };
    })
    .default(() => {
      // Default values for other states
      return { processName, processState, showDetailCardHeadings: true };
    })
    .resolve();
};
