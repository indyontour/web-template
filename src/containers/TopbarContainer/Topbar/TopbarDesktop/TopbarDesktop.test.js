import React from 'react';
import '@testing-library/jest-dom';

import { mergeConfig } from '../../../../util/configHelpers';
import { fakeIntl, createCurrentUser } from '../../../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getDefaultConfiguration,
  getHostedConfiguration,
} from '../../../../util/testHelpers';

import TopbarDesktop from './TopbarDesktop';

const { screen, waitFor } = testingLibrary;

const renderTopbar = extraProps => {
  const hostedConfig = getHostedConfiguration();
  // The same merged configuration the app gives the top bar
  const config = mergeConfig(hostedConfig, getDefaultConfiguration());
  return render(
    <TopbarDesktop
      config={config}
      intl={fakeIntl}
      isAuthenticated
      currentUser={createCurrentUser('user1')}
      currentPage="LandingPage"
      onLogout={() => {}}
      onSearchSubmit={() => {}}
      showSearchForm={false}
      showCreateListingsLink
      inboxTab="orders"
      {...extraProps}
    />,
    { config: hostedConfig }
  );
};

describe('TopbarDesktop profile menu (beaway)', () => {
  it('shows My trips and Booking requests for a user who is both traveler and host', async () => {
    renderTopbar({ showMyTripsLink: true, showBookingRequestsLink: true });

    await waitFor(() => {
      expect(screen.getByText('TopbarDesktop.myTripsLink')).toBeInTheDocument();
    });
    const myTrips = screen.getByText('TopbarDesktop.myTripsLink').closest('a');
    const bookingRequests = screen.getByText('TopbarDesktop.bookingRequestsLink').closest('a');
    expect(myTrips).toHaveAttribute('href', '/inbox/orders');
    expect(bookingRequests).toHaveAttribute('href', '/inbox/sales');
    // The existing links are still there
    expect(screen.getByText('TopbarDesktop.yourListingsLink')).toBeInTheDocument();
    expect(screen.getByText('TopbarDesktop.profileSettingsLink')).toBeInTheDocument();
    expect(screen.getByText('TopbarDesktop.accountSettingsLink')).toBeInTheDocument();
  });

  it('hides Booking requests for a user without the provider role', async () => {
    renderTopbar({ showMyTripsLink: true, showBookingRequestsLink: false });

    await waitFor(() => {
      expect(screen.getByText('TopbarDesktop.myTripsLink')).toBeInTheDocument();
    });
    expect(screen.queryByText('TopbarDesktop.bookingRequestsLink')).not.toBeInTheDocument();
  });
});
