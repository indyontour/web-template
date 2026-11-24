import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import SectionDestinationFeesMaybe from './SectionDestinationFeesMaybe';

const { screen } = testingLibrary;

const emptyFees = destination => ({
  [`DestinationFees.${destination}.entranceThai`]: '',
  [`DestinationFees.${destination}.entranceForeign`]: '',
  [`DestinationFees.${destination}.guideThai`]: '',
  [`DestinationFees.${destination}.guideForeign`]: '',
});

describe('SectionDestinationFeesMaybe', () => {
  it('shows entrance and required guide fees for Thai and foreign visitors', () => {
    const messages = {
      ...emptyFees('krokedokwaterfall'),
      'DestinationFees.krokedokwaterfall.entranceThai': '40',
      'DestinationFees.krokedokwaterfall.entranceForeign': '200',
      'DestinationFees.krokedokwaterfall.guideThai': '100',
      'DestinationFees.krokedokwaterfall.guideForeign': '150',
    };
    render(<SectionDestinationFeesMaybe publicData={{ destination: 'krokedokwaterfall' }} />, {
      messages,
    });

    expect(
      screen.getByRole('heading', { name: 'ListingPage.destinationFeesTitle' })
    ).toBeInTheDocument();
    expect(screen.getByText('DestinationFees.entranceLabel')).toBeInTheDocument();
    expect(screen.getByText('DestinationFees.guideLabel')).toBeInTheDocument();
    expect(screen.getAllByText('DestinationFees.thaiVisitors')).toHaveLength(2);
    expect(screen.getAllByText('DestinationFees.foreignVisitors')).toHaveLength(2);
    expect(screen.getByText('ListingPage.destinationFeesNote')).toBeInTheDocument();
  });

  it('leaves out the guide row when the destination needs no guide', () => {
    const messages = {
      ...emptyFees('khaochalak'),
      'DestinationFees.khaochalak.entranceThai': '40',
    };
    render(<SectionDestinationFeesMaybe publicData={{ destination: 'khaochalak' }} />, {
      messages,
    });
    expect(screen.getByText('DestinationFees.entranceLabel')).toBeInTheDocument();
    expect(screen.queryByText('DestinationFees.guideLabel')).not.toBeInTheDocument();
    expect(screen.queryByText('DestinationFees.foreignVisitors')).not.toBeInTheDocument();
  });

  it('renders nothing without fees or without a destination', () => {
    const { container: noFees } = render(
      <SectionDestinationFeesMaybe publicData={{ destination: 'khaochalak' }} />,
      { messages: emptyFees('khaochalak') }
    );
    expect(noFees).toBeEmptyDOMElement();
    const { container: noDestination } = render(<SectionDestinationFeesMaybe publicData={{}} />);
    expect(noDestination).toBeEmptyDOMElement();
  });
});
