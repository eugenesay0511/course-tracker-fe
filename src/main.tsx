
import ReactDOM from 'react-dom/client'
import App from './App'

// Strict mode is omitted to avoid double rendering which sometimes causes HTML5 video elements to stutter on mount in dev mode
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
)
