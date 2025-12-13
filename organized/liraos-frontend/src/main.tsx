import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ChatProvider } from './context/ChatContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
