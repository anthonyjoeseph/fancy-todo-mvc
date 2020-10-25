import React, { useContext } from 'react';
import Link from '../common/Link';
import { LoggedInLocation, ExistingLocation } from '../../../logic/Location';
import { AppStateContext } from '../../../logic/AppState';
import { User } from 'shared-todo/model';

const Footer = ({
  location,
  user,
}: {
  location: LoggedInLocation
  user: User,
}) => {
  const [,, setLocation] = useContext(AppStateContext)
  return (
    <div>
      <span>Show: </span>
      <Link
        aria-label="Show All"
        onClick={() => setLocation(ExistingLocation.of.AllTodos({ value: { userid: user.id } }))}
        active={!LoggedInLocation.is.AllTodos(location)}
      >
        All
      </Link>
      <Link
        aria-label="Show Active"
        onClick={() => setLocation(ExistingLocation.of.ActiveTodos({ value: { userid: user.id } }))}
        active={!LoggedInLocation.is.ActiveTodos(location)}
      >
        Active
      </Link>
      <Link
        aria-label="Show Completed"
        onClick={() => setLocation(ExistingLocation.of.CompletedTodos({ value: { userid: user.id } }))}
        active={!LoggedInLocation.is.CompletedTodos(location)}
      >
        Completed
      </Link>
    </div>
  )
}

export default Footer;