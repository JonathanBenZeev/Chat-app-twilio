import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import routes from '../routes'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { login, logout, signup } from '../store/user.actions.js'
import { LoginSignup } from './LoginSignup.jsx'
import { IoChatbubbleEllipsesSharp,IoVideocamSharp } from "react-icons/io5";
export function AppHeader() {
  const user = useSelector((storeState) => storeState.userModule.user)
  const location = useLocation()

  async function onLogin(credentials) {
    try {
      const user = await login(credentials)
      showSuccessMsg(`Welcome: ${user.fullname}`)
    } catch (err) {
      showErrorMsg('Cannot login')
    }
  }
  async function onSignup(credentials) {
    try {
      const user = await signup(credentials)
      showSuccessMsg(`Welcome new user: ${user.fullname}`)
    } catch (err) {
      showErrorMsg('Cannot signup')
    }
  }
  async function onLogout() {
    try {
      await logout()
      showSuccessMsg(`Bye now`)
    } catch (err) {
      showErrorMsg('Cannot logout')
    }
  }

  return (
    <header className='app-header'>
      <nav>
        {/* {routes.map(route => <NavLink key={route.path} to={route.path}>{route.label}</NavLink>)} */}
        {/* <NavLink to='/video-chat'>Video</NavLink> */}
        {user && (
          <span className='user-info'>
            <Link to={`user/${user._id}`}>
              {user.imgUrl && <img src={user.imgUrl} />}
              {user.fullname}
            </Link>
            {/* <span className="score">{user.score?.toLocaleString()}</span> */}
            <button onClick={onLogout}>Logout</button>
          </span>
        )}
        {!user && (
          <section className='user-info'>
            <LoginSignup onLogin={onLogin} onSignup={onSignup} />
          </section>
        )}
      </nav>
      <nav>
        <NavLink to={location.pathname === '/chat' ? '/video-chat' : '/chat'}>
          {location.pathname === '/chat' ? <IoVideocamSharp/> : <IoChatbubbleEllipsesSharp/>}
        </NavLink>
      </nav>
    </header>
  )
}
