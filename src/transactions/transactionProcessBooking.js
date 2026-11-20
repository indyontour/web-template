/**
 * Transaction process graph for bookings:
 *   - default-booking
 */

/**
 * Transitions
 *
 * These strings must sync with values defined in Marketplace API,
 * since transaction objects given by API contain info about last transitions.
 * All the actions in API side happen in transitions,
 * so we need to understand what those strings mean.
 */

export const transitions = {
  // When a customer makes a booking to a listing, a transaction is
  // created with the initial request-payment transition.
  // beaway: there's no online payment. Despite the name, this transition only sends the
  // booking request to the provider (seats are held, line items are set). Nothing is charged.
  REQUEST_PAYMENT: 'transition/request-payment',

  // A customer can also initiate a transaction with an inquiry, and
  // then transition that with a request.
  INQUIRE: 'transition/inquire',
  REQUEST_PAYMENT_AFTER_INQUIRY: 'transition/request-payment-after-inquiry',

  // When the provider accepts or declines a transaction from the
  // SalePage, it is transitioned with the accept or decline transition.
  ACCEPT: 'transition/accept',
  DECLINE: 'transition/decline',
  // beaway: the customer can withdraw a pending request before the provider answers.
  // The held seats are released.
  CUSTOMER_WITHDRAW_REQUEST: 'transition/customer-withdraw-request',

  // The operator can accept or decline the offer on behalf of the provider
  OPERATOR_ACCEPT: 'transition/operator-accept',
  OPERATOR_DECLINE: 'transition/operator-decline',

  // The backend automatically expire the transaction.
  EXPIRE: 'transition/expire',
  // beaway: a request made more than 12 hours before departure expires 12 hours before
  // departure (if still unanswered). Later requests use EXPIRE, which waits until departure.
  EXPIRE_BEFORE_CANCELLATION_WINDOW: 'transition/expire-before-cancellation-window',

  // Admin can also cancel the transition.
  CANCEL: 'transition/cancel',
  // beaway: the customer can cancel an accepted booking until 12 hours before departure,
  // the provider can cancel at any time before the trip completes.
  CUSTOMER_CANCEL: 'transition/customer-cancel',
  PROVIDER_CANCEL: 'transition/provider-cancel',
  // beaway: 12 hours before departure the booking moves to cancellation-closed automatically.
  CLOSE_CANCELLATION: 'transition/close-cancellation',
  PROVIDER_CANCEL_AFTER_WINDOW: 'transition/provider-cancel-after-window',
  OPERATOR_CANCEL_AFTER_WINDOW: 'transition/operator-cancel-after-window',

  // The backend will mark the transaction completed.
  COMPLETE: 'transition/complete',
  OPERATOR_COMPLETE: 'transition/operator-complete',

  // Reviews are given through transaction transitions. Review 1 can be
  // by provider or customer, and review 2 will be the other party of
  // the transaction.
  REVIEW_1_BY_PROVIDER: 'transition/review-1-by-provider',
  REVIEW_2_BY_PROVIDER: 'transition/review-2-by-provider',
  REVIEW_1_BY_CUSTOMER: 'transition/review-1-by-customer',
  REVIEW_2_BY_CUSTOMER: 'transition/review-2-by-customer',
  EXPIRE_CUSTOMER_REVIEW_PERIOD: 'transition/expire-customer-review-period',
  EXPIRE_PROVIDER_REVIEW_PERIOD: 'transition/expire-provider-review-period',
  EXPIRE_REVIEW_PERIOD: 'transition/expire-review-period',
};

/**
 * States
 *
 * These constants are only for making it clear how transitions work together.
 * You should not use these constants outside of this file.
 *
 * Note: these states are not in sync with states used transaction process definitions
 *       in Marketplace API. Only last transitions are passed along transaction object.
 */
export const states = {
  INITIAL: 'initial',
  INQUIRY: 'inquiry',
  // beaway: these two states don't exist in the no-payment process. They're kept only so that
  // shared template checks like `state === states.PENDING_PAYMENT` keep evaluating to false.
  PENDING_PAYMENT: 'pending-payment',
  PAYMENT_EXPIRED: 'payment-expired',
  PREAUTHORIZED: 'preauthorized',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
  ACCEPTED: 'accepted',
  CANCELLATION_CLOSED: 'cancellation-closed',
  EXPIRED: 'expired',
  CANCELED: 'canceled',
  DELIVERED: 'delivered',
  REVIEWED: 'reviewed',
  REVIEWED_BY_CUSTOMER: 'reviewed-by-customer',
  REVIEWED_BY_PROVIDER: 'reviewed-by-provider',
};

/**
 * Description of transaction process graph
 *
 * You should keep this in sync with transaction process defined in Marketplace API
 *
 * Note: we don't use yet any state machine library,
 *       but this description format is following Xstate (FSM library)
 *       https://xstate.js.org/docs/
 */
export const graph = {
  // id is defined only to support Xstate format.
  // However if you have multiple transaction processes defined,
  // it is best to keep them in sync with transaction process aliases.
  id: 'default-booking/release-1',

  // This 'initial' state is a starting point for new transaction
  initial: states.INITIAL,

  // States
  states: {
    [states.INITIAL]: {
      on: {
        [transitions.INQUIRE]: states.INQUIRY,
        // beaway: no payment step, the request goes straight to the provider
        [transitions.REQUEST_PAYMENT]: states.PREAUTHORIZED,
      },
    },
    [states.INQUIRY]: {
      on: {
        [transitions.REQUEST_PAYMENT_AFTER_INQUIRY]: states.PREAUTHORIZED,
      },
    },

    [states.PREAUTHORIZED]: {
      on: {
        [transitions.DECLINE]: states.DECLINED,
        [transitions.OPERATOR_DECLINE]: states.DECLINED,
        [transitions.CUSTOMER_WITHDRAW_REQUEST]: states.WITHDRAWN,
        [transitions.EXPIRE]: states.EXPIRED,
        [transitions.EXPIRE_BEFORE_CANCELLATION_WINDOW]: states.EXPIRED,
        [transitions.ACCEPT]: states.ACCEPTED,
        [transitions.OPERATOR_ACCEPT]: states.ACCEPTED,
      },
    },

    [states.DECLINED]: {},
    [states.WITHDRAWN]: {},
    [states.EXPIRED]: {},
    [states.ACCEPTED]: {
      on: {
        [transitions.CANCEL]: states.CANCELED,
        [transitions.CUSTOMER_CANCEL]: states.CANCELED,
        [transitions.PROVIDER_CANCEL]: states.CANCELED,
        [transitions.CLOSE_CANCELLATION]: states.CANCELLATION_CLOSED,
      },
    },
    [states.CANCELLATION_CLOSED]: {
      on: {
        [transitions.PROVIDER_CANCEL_AFTER_WINDOW]: states.CANCELED,
        [transitions.OPERATOR_CANCEL_AFTER_WINDOW]: states.CANCELED,
        [transitions.COMPLETE]: states.DELIVERED,
        [transitions.OPERATOR_COMPLETE]: states.DELIVERED,
      },
    },

    [states.CANCELED]: {},
    [states.DELIVERED]: {
      on: {
        [transitions.EXPIRE_REVIEW_PERIOD]: states.REVIEWED,
        [transitions.REVIEW_1_BY_CUSTOMER]: states.REVIEWED_BY_CUSTOMER,
        [transitions.REVIEW_1_BY_PROVIDER]: states.REVIEWED_BY_PROVIDER,
      },
    },

    [states.REVIEWED_BY_CUSTOMER]: {
      on: {
        [transitions.REVIEW_2_BY_PROVIDER]: states.REVIEWED,
        [transitions.EXPIRE_PROVIDER_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
    [states.REVIEWED_BY_PROVIDER]: {
      on: {
        [transitions.REVIEW_2_BY_CUSTOMER]: states.REVIEWED,
        [transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD]: states.REVIEWED,
      },
    },
    [states.REVIEWED]: { type: 'final' },
  },
};

// Check if a transition is the kind that should be rendered
// when showing transition history (e.g. ActivityFeed)
// The first transition and most of the expiration transitions made by system are not relevant
export const isRelevantPastTransition = transition => {
  return [
    // beaway: the request itself is shown, since there's no confirm-payment step after it
    transitions.REQUEST_PAYMENT,
    transitions.REQUEST_PAYMENT_AFTER_INQUIRY,
    transitions.ACCEPT,
    transitions.OPERATOR_ACCEPT,
    transitions.CANCEL,
    transitions.CUSTOMER_CANCEL,
    transitions.PROVIDER_CANCEL,
    transitions.PROVIDER_CANCEL_AFTER_WINDOW,
    transitions.OPERATOR_CANCEL_AFTER_WINDOW,
    transitions.COMPLETE,
    transitions.OPERATOR_COMPLETE,
    transitions.DECLINE,
    transitions.OPERATOR_DECLINE,
    transitions.CUSTOMER_WITHDRAW_REQUEST,
    transitions.EXPIRE,
    transitions.EXPIRE_BEFORE_CANCELLATION_WINDOW,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_CUSTOMER,
    transitions.REVIEW_2_BY_PROVIDER,
  ].includes(transition);
};

// Processes might be different on how reviews are handled.
// Default processes use two-sided diamond shape, where either party can make the review first
export const isCustomerReview = transition => {
  return [transitions.REVIEW_1_BY_CUSTOMER, transitions.REVIEW_2_BY_CUSTOMER].includes(transition);
};

// Processes might be different on how reviews are handled.
// Default processes use two-sided diamond shape, where either party can make the review first
export const isProviderReview = transition => {
  return [transitions.REVIEW_1_BY_PROVIDER, transitions.REVIEW_2_BY_PROVIDER].includes(transition);
};

// Check if the given transition is privileged.
//
// Privileged transitions need to be handled from a secure context,
// i.e. the backend. This helper is used to check if the transition
// should go through the local API endpoints, or if using JS SDK is
// enough.
export const isPrivileged = transition => {
  return [transitions.REQUEST_PAYMENT, transitions.REQUEST_PAYMENT_AFTER_INQUIRY].includes(
    transition
  );
};

/**
 * Client-side map of payment methods this process handles at checkout.
 *
 * Structure: supportedPayments[processor][methodId] = { paymentDirection }
 *
 * This does not create Stripe/Sharetribe support by itself. Support depends on the
 * transaction process saved to the Sharetribe backend (CLI): transitions and their
 * Stripe actions. Only declare methods your backend process is built for.
 *
 * paymentDirection:
 * - 'pull' — card-style: authorize now, capture later (e.g. when the provider accepts)
 * - 'push' — customer pays on confirm; funds are pushed (no preauthorization)
 *
 * Defaults come from paymentMethods.js via stripePaymentMethodInfo; override only if needed.
 */
// beaway: no online payments. An empty object marks this process as not Stripe-related:
// checkout shows no card form, hosts aren't asked for payout details,
// and any currency with known subunits (e.g. THB) is allowed.
export const supportedPayments = {};

/**
 * beaway: the transition that sends the booking request (no payment involved).
 *
 * @param {string} [state='initial'] - current transaction state (from process.states)
 * @returns {string} request-payment-after-inquiry when continuing an inquiry, else request-payment
 */
export const getRequestTransition = (state = states.INITIAL) =>
  state === states.INQUIRY
    ? transitions.REQUEST_PAYMENT_AFTER_INQUIRY
    : transitions.REQUEST_PAYMENT;

/**
 * Resolve checkout transitions for a payment method and transaction state.
 * beaway: this process has no supported payments, so this always throws.
 * Checkout uses getRequestTransition instead (CheckoutPageWithoutPayment).
 *
 * @param {Object} params
 * @param {string} params.paymentProcessor - e.g. 'stripe'
 * @param {string} params.paymentMethod - e.g. 'card'
 * @param {string} [params.unsupportedPaymentErrorMessage] - shared error message from transaction.js wrapper
 * @throws {Error} always, because supportedPayments is empty
 */
export const getCheckoutPaymentTransitions = ({
  paymentProcessor,
  paymentMethod,
  unsupportedPaymentErrorMessage,
}) => {
  throw new Error(
    unsupportedPaymentErrorMessage ||
      `Unsupported payment: processor=${paymentProcessor}, method=${paymentMethod}`
  );
};

// Check when transaction is completed (booking over)
export const isCompleted = transition => {
  const txCompletedTransitions = [
    transitions.COMPLETE,
    transitions.OPERATOR_COMPLETE,
    transitions.REVIEW_1_BY_CUSTOMER,
    transitions.REVIEW_1_BY_PROVIDER,
    transitions.REVIEW_2_BY_CUSTOMER,
    transitions.REVIEW_2_BY_PROVIDER,
    transitions.EXPIRE_REVIEW_PERIOD,
    transitions.EXPIRE_CUSTOMER_REVIEW_PERIOD,
    transitions.EXPIRE_PROVIDER_REVIEW_PERIOD,
  ];
  return txCompletedTransitions.includes(transition);
};

// beaway: there's no payment step, so payment can't expire.
export const hasPaymentExpired = () => false;

// beaway: nothing is ever charged, so nothing is refunded.
export const isRefunded = () => false;

export const statesNeedingProviderAttention = [states.PREAUTHORIZED];
