import React from 'react';
import classNames from 'classnames';

import { useIntl } from '../../util/reactIntl';

import css from './VerifiedHostMark.module.css';

/**
 * beaway: true when the operator has marked this user as a verified host in Console
 * (metadata user field "verifiedhost" equals "yes").
 *
 * @param {Object} user - API entity: user
 * @returns {boolean}
 */
export const isVerifiedHost = user => user?.attributes?.profile?.metadata?.verifiedhost === 'yes';

/**
 * beaway: small green round "✓" shown next to a verified host's name
 * (trip cards and the listing page author line). Renders nothing for other users.
 * Screen readers hear "Verified host".
 *
 * @component
 * @param {Object} props
 * @param {Object} props.user - API entity: user
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @returns {JSX.Element|null}
 */
const VerifiedHostMark = props => {
  const { user, className } = props;
  const intl = useIntl();

  if (!isVerifiedHost(user)) {
    return null;
  }

  const label = intl.formatMessage({ id: 'VerifiedHostMark.label' });
  return (
    <span className={classNames(css.root, className)} title={label}>
      <span aria-hidden="true">✓</span>
      <span className={css.visuallyHidden}>{label}</span>
    </span>
  );
};

export default VerifiedHostMark;
