import { HomePage } from './pages/HomePage.jsx'
import { ChatApp } from './pages/Chat.jsx'
import { VideoChat } from './pages/VideoChat'

// Routes accesible from the main navigation (in AppHeader)
const routes = [
  {
    path: '/',
    component: <HomePage />,
    label: 'Home 🏠',
  },
  {
    path: 'chat',
    component: <ChatApp />,
    label: 'Chat',
  },
  {
    path: 'video-chat',
    component: <VideoChat />,
    label: 'Video chat',
  },
]

export default routes
