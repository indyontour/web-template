import React from 'react';
import '@testing-library/jest-dom';

import { pickCategoryFields } from '../../../../util/fieldHelpers';
import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingDetailsForm from './EditListingDetailsForm';

const { screen, userEvent, within } = testingLibrary;

const noop = () => null;

describe('EditListingDetailsForm', () => {
  it('Check that shipping fees can be given and submit button activates', async () => {
    const user = userEvent.setup();
    const saveActionMsg = 'Save details';

    const selectableListingTypes = [
      {
        listingType: 'sell-bicycles',
        transactionProcessAlias: 'default-purchase/release-1',
        unitType: 'item',
      },
    ];

    const listingFieldsConfig = [
      {
        key: 'clothing',
        scope: 'public',
        listingTypeConfig: {
          limitToListingTypeIds: true,
          listingTypeIds: ['sell-bicycles'],
        },
        schemaType: 'enum',
        enumOptions: [
          { option: 'men', label: 'Men' },
          { option: 'women', label: 'Women' },
          { option: 'kids', label: 'Kids' },
        ],
        filterConfig: {
          showFilter: true,
          label: 'Clothing',
        },
        showConfig: {
          label: 'Clothing',
          isDetail: true,
        },
        saveConfig: {
          label: 'Clothing',
        },
      },
      {
        key: 'amenities',
        scope: 'public',
        listingTypeConfig: {
          limitToListingTypeIds: true,
          listingTypeIds: ['rent-bicycles-daily', 'rent-bicycles-nightly', 'rent-bicycles-hourly'],
        },
        schemaType: 'multi-enum',
        enumOptions: [
          { option: 'towels', label: 'Towels' },
          { option: 'bathroom', label: 'Bathroom' },
          { option: 'swimming_pool', label: 'Swimming pool' },
          { option: 'barbeque', label: 'Barbeque' },
        ],
        filterConfig: {
          showFilter: true,
          label: 'Amenities',
        },
        showConfig: {
          label: 'Amenities',
        },
        saveConfig: {
          label: 'Amenities',
        },
      },
    ];

    render(
      <EditListingDetailsForm
        intl={fakeIntl}
        dispatch={noop}
        onListingTypeChange={noop}
        onSubmit={v => v}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        listingFieldsConfig={listingFieldsConfig}
        categoryPrefix="categoryLevel"
        selectableCategories={[]}
        pickSelectedCategories={values => pickCategoryFields(values, 'categoryLevel', 1, [])}
        selectableListingTypes={selectableListingTypes}
        hasExistingListingType={true}
        initialValues={selectableListingTypes[0]}
        marketplaceCurrency="EUR"
      />
    );

    // Pickup fields
    const title = 'EditListingDetailsForm.title';
    expect(screen.getByText(title)).toBeInTheDocument();

    const description = 'EditListingDetailsForm.description';
    expect(screen.getByText(description)).toBeInTheDocument();

    // Test that save button is disabled at first
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();

    // Fill mandatory attributes
    await user.type(screen.getByRole('textbox', { name: title }), 'My Listing');
    await user.type(screen.getByRole('textbox', { name: description }), 'Lorem ipsum');

    // Fill custom listing field
    await user.selectOptions(screen.getByLabelText('Clothing'), 'kids');

    // Test that save button is enabled
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });

  describe('beaway destination suggestions', () => {
    const saveActionMsg = 'Save details';
    const tripType = {
      listingType: 'trip',
      transactionProcessAlias: 'default-booking/release-1',
      unitType: 'hour',
    };
    const fieldsConfig = [
      {
        key: 'destination',
        scope: 'public',
        schemaType: 'enum',
        enumOptions: [
          { option: 'khaochalak', label: 'Khao Chalak' },
          { option: 'saladdaiwaterfall', label: 'Salad Dai Waterfall' },
          { option: 'notconfigured', label: 'Somewhere else' },
        ],
        saveConfig: { label: 'Destination' },
      },
      {
        key: 'departurepoint',
        scope: 'public',
        schemaType: 'text',
        saveConfig: { label: 'Departure point' },
      },
      {
        key: 'tripduration',
        scope: 'public',
        schemaType: 'long',
        minimum: 1,
        maximum: 48,
        saveConfig: { label: 'Estimated trip length (hours)' },
      },
    ];

    const renderForm = (initialValues = {}, messages) =>
      render(
        <EditListingDetailsForm
          intl={fakeIntl}
          dispatch={noop}
          onListingTypeChange={noop}
          onSubmit={v => v}
          saveActionMsg={saveActionMsg}
          updated={false}
          updateInProgress={false}
          disabled={false}
          ready={false}
          listingFieldsConfig={fieldsConfig}
          categoryPrefix="categoryLevel"
          selectableCategories={[]}
          pickSelectedCategories={values => pickCategoryFields(values, 'categoryLevel', 1, [])}
          selectableListingTypes={[tripType]}
          hasExistingListingType={true}
          initialValues={{ ...tripType, ...initialValues }}
          marketplaceCurrency="THB"
        />,
        { messages }
      );
    const descriptionBox = () =>
      screen.getByRole('textbox', { name: 'EditListingDetailsForm.description' });

    const meetingPointNames = () =>
      within(screen.getByRole('group', { name: 'EditListingDetailsForm.meetingPointsLabel' }))
        .getAllByRole('button')
        .map(button => button.textContent);

    it('shows all 6 meeting points without a destination or with an unknown one', async () => {
      const user = userEvent.setup();
      renderForm();
      expect(meetingPointNames()).toHaveLength(6);
      expect(screen.queryByText(/about \d+ to \d+ hrs/)).not.toBeInTheDocument();
      await user.selectOptions(screen.getByLabelText('Destination'), 'notconfigured');
      expect(meetingPointNames()).toHaveLength(6);
      expect(descriptionBox()).toHaveValue('');
    });

    it("lists the destination's own meeting points first", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.selectOptions(screen.getByLabelText('Destination'), 'khaochalak');
      expect(meetingPointNames()).toEqual([
        'Ekkamai Bus Terminal',
        'On Nut BTS',
        'Thonglor BTS',
        'Ari BTS',
        'Mo Chit BTS',
        'Victory Monument',
      ]);
    });

    it('shows hints and meeting points, and never touches the description', async () => {
      const user = userEvent.setup();
      renderForm();
      await user.selectOptions(screen.getByLabelText('Destination'), 'khaochalak');

      expect(descriptionBox()).toHaveValue('');
      expect(screen.getByText('EditListingDetailsForm.destinationPlanShown')).toBeInTheDocument();
      expect(screen.queryByText(/Host:/)).not.toBeInTheDocument();
      expect(screen.getByText(/about 6 to 8 hrs/)).toBeInTheDocument();
      expect(screen.getByLabelText('Estimated trip length (hours)')).toHaveValue(null);

      await user.click(screen.getByRole('button', { name: 'On Nut BTS' }));
      expect(screen.getByLabelText('Departure point')).toHaveValue('On Nut BTS');

      await user.selectOptions(screen.getByLabelText('Destination'), 'saladdaiwaterfall');
      expect(screen.getByRole('button', { name: 'Mo Chit BTS' })).toBeInTheDocument();
      expect(descriptionBox()).toHaveValue('');
    });

    it('keeps an existing description when the destination changes', async () => {
      const user = userEvent.setup();
      renderForm({ description: 'Saved description', pub_destination: 'khaochalak' });
      await user.selectOptions(screen.getByLabelText('Destination'), 'saladdaiwaterfall');
      expect(descriptionBox()).toHaveValue('Saved description');
    });

    it('shows the destination fees read-only under Destination', async () => {
      const user = userEvent.setup();
      renderForm(
        {},
        {
          'DestinationFees.khaochalak.entranceThai': '',
          'DestinationFees.khaochalak.entranceForeign': '',
          'DestinationFees.saladdaiwaterfall.entranceThai': '40',
          'DestinationFees.saladdaiwaterfall.entranceForeign': '200',
          'DestinationFees.saladdaiwaterfall.guideThai': '',
          'DestinationFees.saladdaiwaterfall.guideForeign': '',
        }
      );
      await user.selectOptions(screen.getByLabelText('Destination'), 'khaochalak');
      expect(
        screen.queryByText('EditListingDetailsForm.destinationFeesInfo')
      ).not.toBeInTheDocument();

      await user.selectOptions(screen.getByLabelText('Destination'), 'saladdaiwaterfall');
      expect(screen.getByText('EditListingDetailsForm.destinationFeesInfo')).toBeInTheDocument();
      expect(screen.getByText(/DestinationFees.entranceLabel/)).toBeInTheDocument();
      expect(screen.queryByText(/DestinationFees.guideLabel/)).not.toBeInTheDocument();
    });
  });
});
