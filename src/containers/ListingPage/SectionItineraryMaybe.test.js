import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import SectionItineraryMaybe from './SectionItineraryMaybe';

const { screen } = testingLibrary;

describe('SectionItineraryMaybe', () => {
  it('shows the plan for the day as numbered steps for a configured destination', () => {
    const listingFieldConfigs = [
      {
        key: 'destination',
        enumOptions: [{ option: 'khaochalak', label: 'Khao Chalak - Chonburi / 1.5 hrs.' }],
      },
    ];
    render(
      <SectionItineraryMaybe
        publicData={{ destination: 'khaochalak' }}
        listingFieldConfigs={listingFieldConfigs}
      />
    );

    expect(screen.getByText('Khao Chalak - Chonburi / 1.5 hrs.')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'ListingPage.itineraryTitle' })).toBeInTheDocument();
    const steps = screen.getAllByRole('listitem');
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveTextContent(
      'Meet at the departure point and drive to Khao Chalak (about 1.5 hrs).'
    );
    expect(steps[3]).toHaveTextContent('Drive back to Bangkok.');
    expect(screen.queryByText(/Host:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Plan for the day:/)).not.toBeInTheDocument();
  });

  it('renders nothing without a destination or with an unknown one', () => {
    const { container: noDestination } = render(<SectionItineraryMaybe publicData={{}} />);
    expect(noDestination).toBeEmptyDOMElement();
    const { container: unknown } = render(
      <SectionItineraryMaybe publicData={{ destination: 'atlantis' }} />
    );
    expect(unknown).toBeEmptyDOMElement();
    const { container: noPublicData } = render(<SectionItineraryMaybe />);
    expect(noPublicData).toBeEmptyDOMElement();
  });
});
