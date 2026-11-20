import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';

// Import contexts and util modules
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureTransaction } from '../../util/data';
import { createSlug } from '../../util/urlHelpers';
import { isTransactionInitiateListingNotFoundError } from '../../util/errors';
import {
  getPropsForCustomTransactionFieldInputs,
  pickTransactionFieldsData,
} from '../../util/fieldHelpers.js';
import { getProcess } from '../../transactions/transaction';

// Import shared components
import {
  CustomExtendedDataField,
  FieldTextInput,
  Form,
  H3,
  H4,
  Heading,
  NamedLink,
  OrderBreakdown,
  Page,
  PrimaryButton,
  TopbarSimplified,
} from '../../components';

// Session helpers file needs to be imported before other CheckoutPage modules that use it
import { storeData } from './CheckoutPageSessionHelpers';

import {
  completeCheckoutNavigation,
  getFormattedTotalPrice,
  persistTransaction,
} from './CheckoutPageTransactionHelpers.js';
import { getOrderParams } from './CheckoutPageWithPayment';
import { getErrorMessages } from './ErrorMessages';

import DetailsSideCard from './DetailsSideCard';
import MobileListingImage from './MobileListingImage';
import MobileOrderBreakdown from './MobileOrderBreakdown';

import css from './CheckoutPage.module.css';

/**
 * beaway: true when the transaction has already been sent as a request
 * (i.e. it's past the initial and inquiry states), so it must not be requested again.
 */
const hasTransactionBeenRequested = (tx, process) => {
  if (!tx?.id || !process) {
    return false;
  }
  const state = process.getState(tx);
  return ![process.states.INITIAL, process.states.INQUIRY].includes(state);
};

/**
 * beaway: the transition that sends the booking request (no payment involved).
 */
const getRequestTransitionForTx = (process, tx) => {
  const state = tx?.id ? process.getState(tx) : process.states.INITIAL;
  return process.getRequestTransition(state);
};

const getProcessForPageData = pageData => {
  const tx = pageData?.transaction;
  const processName =
    tx?.attributes?.processName ||
    pageData?.listing?.attributes?.publicData?.transactionProcessAlias?.split('/')[0];
  return processName ? getProcess(processName) : null;
};

/**
 * beaway: load initial data for checkout without payment.
 * Fetches a speculated transaction, so the page can show the price breakdown
 * (price × seats = total) before the request is sent. No Stripe data is fetched.
 *
 * @param {Object} params
 * @param {Object} params.pageData data saved to session storage (listing, orderData, transaction)
 * @param {Function} params.fetchSpeculatedTransaction
 * @param {Object} params.config app-wide configs
 */
export const loadInitialDataWithoutPayment = ({ pageData, fetchSpeculatedTransaction, config }) => {
  const process = getProcessForPageData(pageData);
  const tx = pageData?.transaction;
  const shouldSpeculate =
    !!pageData?.listing?.id &&
    !!pageData?.orderData &&
    !!process &&
    !hasTransactionBeenRequested(tx, process);

  if (!shouldSpeculate) {
    return;
  }

  const orderParams = getOrderParams(pageData, {}, {}, config, {}, undefined, process);
  const processAlias = pageData.listing.attributes.publicData?.transactionProcessAlias;
  const requestTransition = getRequestTransitionForTx(process, tx);
  const isPrivileged = process.isPrivileged(requestTransition);

  fetchSpeculatedTransaction(
    orderParams,
    processAlias,
    tx?.id || null,
    requestTransition,
    isPrivileged
  );
};

const handleSubmit = (values, process, props, submitting, setSubmitting) => {
  if (submitting) {
    return;
  }
  setSubmitting(true);

  const {
    pageData,
    config,
    onInitiateOrder,
    history,
    routeConfiguration,
    dispatch,
    onSubmitCallback,
    setPageData,
    sessionStorageKey,
    transactionFieldConfigs = [],
  } = props;

  const { message, ...restOfValues } = values;
  const transactionFieldsProtectedData = pickTransactionFieldsData(
    restOfValues,
    'protected',
    true,
    transactionFieldConfigs
  );
  const orderParams = getOrderParams(
    pageData,
    {},
    {},
    config,
    transactionFieldsProtectedData,
    message,
    process
  );

  const tx = ensureTransaction(pageData.transaction);
  const processAlias = pageData?.listing?.attributes?.publicData?.transactionProcessAlias;
  const requestTransition = getRequestTransitionForTx(process, tx);
  const isPrivileged = process.isPrivileged(requestTransition);

  // A single (privileged) transition sends the booking request. Nothing is charged.
  onInitiateOrder(orderParams, processAlias, tx.id, requestTransition, isPrivileged)
    .then(order => {
      persistTransaction(order, pageData, storeData, setPageData, sessionStorageKey);
      setSubmitting(false);
      completeCheckoutNavigation({
        response: order,
        history,
        routeConfiguration,
        dispatch,
        onSubmitCallback,
      });
    })
    .catch(err => {
      console.error(err);
      setSubmitting(false);
    });
};

/**
 * beaway: checkout page for processes without online payments (default-booking in beaway).
 * The traveler reviews the booking (date, seats, total paid to the host on the day),
 * adds an optional message and sends the request. There's no card form.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.scrollingDisabled - Whether scrolling is disabled
 * @param {propTypes.error} props.speculateTransactionError - Error from the speculated transaction
 * @param {propTypes.transaction} props.speculatedTransaction - The speculated transaction
 * @param {propTypes.error} props.initiateOrderError - Error from sending the request
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {boolean} props.showListingImage - Whether to show the listing image
 * @param {Object} props.pageData - The page data (listing, orderData, transaction)
 * @param {string} props.processName - The process name
 * @param {string} props.listingTitle - The listing title
 * @param {string} props.title - The page title
 * @param {Array<Object>} props.transactionFieldConfigs - Transaction field configs
 * @param {boolean} props.showTransactionFields - Whether to show transaction fields
 * @param {Object} props.config - The config object
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
export const CheckoutPageWithoutPayment = props => {
  const [submitting, setSubmitting] = useState(false);

  const {
    scrollingDisabled,
    speculateTransactionError,
    speculatedTransaction: speculatedTransactionMaybe,
    initiateOrderError,
    intl,
    currentUser,
    showListingImage,
    pageData,
    processName,
    listingTitle,
    title,
    transactionFieldConfigs = [],
    showTransactionFields,
    config,
  } = props;

  const listingNotFound =
    isTransactionInitiateListingNotFoundError(speculateTransactionError) ||
    isTransactionInitiateListingNotFoundError(initiateOrderError);

  const { listing, transaction } = pageData;
  const existingTransaction = ensureTransaction(transaction);
  const speculatedTransaction = ensureTransaction(speculatedTransactionMaybe, {}, null);

  // If the existing transaction has line items, it has gone through the request transition.
  // Otherwise, the speculated transaction gives the breakdown.
  const tx =
    existingTransaction?.attributes?.lineItems?.length > 0
      ? existingTransaction
      : speculatedTransaction;
  const timeZone = listing?.attributes?.availabilityPlan?.timezone;
  const priceVariantName = tx.attributes.protectedData?.priceVariantName;
  const txBookingMaybe = tx?.booking?.id ? { booking: tx.booking, timeZone } : {};
  const hasLineItems = !!tx.id && tx.attributes.lineItems?.length > 0;

  const breakdown = hasLineItems ? (
    <OrderBreakdown
      className={css.orderBreakdown}
      userRole="customer"
      transaction={tx}
      {...txBookingMaybe}
      currency={config.currency}
      marketplaceName={config.marketplaceName}
    />
  ) : null;
  const totalPrice = hasLineItems ? getFormattedTotalPrice(tx, intl) : null;

  const process = processName ? getProcess(processName) : null;
  const transitions = process?.transitions;
  const txTransitions = existingTransaction?.attributes?.transitions || [];
  const hasInquireTransition = txTransitions.find(tr => tr.transition === transitions?.INQUIRE);

  const firstImage = listing?.images?.length > 0 ? listing.images[0] : null;
  const listingLink = (
    <NamedLink
      name="ListingPage"
      params={{ id: listing?.id?.uuid, slug: createSlug(listingTitle) }}
    >
      <FormattedMessage id="CheckoutPage.errorlistingLinkText" />
    </NamedLink>
  );
  const errorMessages = getErrorMessages(
    listingNotFound,
    initiateOrderError,
    false,
    null,
    speculateTransactionError,
    listingLink
  );

  const showForm = !!(
    currentUser &&
    !listingNotFound &&
    !initiateOrderError &&
    !speculateTransactionError
  );
  const providerDisplayName = listing?.author?.attributes?.profile?.displayName;

  const transactionFieldsProps =
    showTransactionFields && transactionFieldConfigs.length > 0
      ? getPropsForCustomTransactionFieldInputs(transactionFieldConfigs, true)
      : [];

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <TopbarSimplified />
      <div className={css.contentContainer}>
        <MobileListingImage
          listingTitle={listingTitle}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
          showListingImage={showListingImage}
        />
        <main className={css.orderFormContainer}>
          <div className={css.headingContainer}>
            <H3 as="h1" className={css.heading}>
              {title}
            </H3>
            <H4 as="h2" className={css.detailsHeadingMobile}>
              <FormattedMessage id="CheckoutPage.listingTitle" values={{ listingTitle }} />
            </H4>
          </div>
          <MobileOrderBreakdown
            speculateTransactionErrorMessage={errorMessages.speculateTransactionErrorMessage}
            breakdown={breakdown}
            priceVariantName={priceVariantName}
          />
          <section className={css.paymentContainer}>
            {errorMessages.initiateOrderErrorMessage}
            {errorMessages.listingNotFoundErrorMessage}
            {errorMessages.speculateErrorMessage}

            {showForm ? (
              <FinalForm
                onSubmit={values => handleSubmit(values, process, props, submitting, setSubmitting)}
                mutators={{ ...arrayMutators }}
                render={formRenderProps => {
                  const { handleSubmit: onFormSubmit } = formRenderProps;
                  return (
                    <Form
                      className={css.paymentForm}
                      onSubmit={onFormSubmit}
                      enforcePagePreloadFor="OrderDetailsPage"
                    >
                      {transactionFieldsProps.length > 0 ? (
                        <div className={css.transactionFieldsContainer}>
                          {transactionFieldsProps.map(({ key, ...fieldProps }) => (
                            <CustomExtendedDataField
                              key={key}
                              {...fieldProps}
                              formId="CheckoutPageWithoutPaymentForm"
                            />
                          ))}
                        </div>
                      ) : null}

                      {!hasInquireTransition ? (
                        <div className={css.section}>
                          <Heading as="h4" rootClassName={css.sectionHeading}>
                            <FormattedMessage id="CheckoutPageWithoutPayment.messageHeading" />
                          </Heading>
                          <FieldTextInput
                            className={css.fieldInquiryMessage}
                            type="textarea"
                            name="message"
                            id="CheckoutPageWithoutPaymentForm.message"
                            label={intl.formatMessage({
                              id: 'CheckoutPageWithoutPayment.messageLabel',
                            })}
                            placeholder={intl.formatMessage(
                              { id: 'CheckoutPageWithoutPayment.messagePlaceholder' },
                              { name: providerDisplayName }
                            )}
                          />
                        </div>
                      ) : null}

                      <div className={css.section}>
                        <p className={css.payOnTheDayNote}>
                          {totalPrice ? (
                            <FormattedMessage
                              id="CheckoutPageWithoutPayment.payOnTheDayWithTotal"
                              values={{ totalPrice, providerName: providerDisplayName }}
                            />
                          ) : (
                            <FormattedMessage
                              id="CheckoutPageWithoutPayment.payOnTheDay"
                              values={{ providerName: providerDisplayName }}
                            />
                          )}
                        </p>
                        <PrimaryButton
                          type="submit"
                          inProgress={submitting}
                          disabled={submitting || !hasLineItems}
                        >
                          <FormattedMessage id="CheckoutPageWithoutPayment.submitButtonText" />
                        </PrimaryButton>
                      </div>
                    </Form>
                  );
                }}
              />
            ) : null}
          </section>
        </main>

        <DetailsSideCard
          listing={listing}
          listingTitle={listingTitle}
          priceVariantName={priceVariantName}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
          speculateTransactionErrorMessage={errorMessages.speculateTransactionErrorMessage}
          isInquiryProcess={false}
          processName={processName}
          breakdown={breakdown}
          showListingImage={showListingImage}
          intl={intl}
        />
      </div>
    </Page>
  );
};

export default CheckoutPageWithoutPayment;
