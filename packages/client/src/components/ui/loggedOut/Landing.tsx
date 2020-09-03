import React, { useContext } from 'react'
import { AppStateContext } from '../../../logic/AppState'
import { ExistingLocation } from '../../../logic/Location'
import Link from '../common/Link'

const Landing = () => {
  const [,, setLocation] = useContext(AppStateContext)
  return (
    <div>
      Welcome to fancy todo!
      <Link
        aria-label="Log in"
        onClick={() => setLocation(ExistingLocation.of.Login({ value: {} }))}
        active
      >
        Log in
      </Link>
    </div>
  )
}

export default Landing
