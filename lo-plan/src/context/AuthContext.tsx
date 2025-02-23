import { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  accessToken: string | null
  login: () => void
  handleCallback: (code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const CLIENT_ID = import.meta.env.VITE_BASIC_CLIENT_ID
  const REDIRECT_URI = `${window.location.origin}/callback`

  const login = () => {
    const state = Math.random().toString(36).substring(7)
    localStorage.setItem('auth_state', state)
    
    const authUrl = `https://api.basic.tech/auth/authorize?` + 
      `response_type=code&` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=profile&` +
      `state=${state}`
    
    window.location.href = authUrl
  }

  const handleCallback = async (code: string) => {
    try {
      const response = await fetch('https://api.basic.tech/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()
      
      if (data.access_token) {
        setAccessToken(data.access_token)
        setIsAuthenticated(true)
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error)
    }
  }

  const logout = () => {
    setAccessToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      setAccessToken(token)
      setIsAuthenticated(true)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      accessToken, 
      login, 
      handleCallback, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

