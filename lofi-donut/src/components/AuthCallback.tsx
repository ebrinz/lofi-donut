// Create the callback component
// src/components/AuthCallback.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AuthCallback = () => {
  const { handleCallback } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const savedState = localStorage.getItem('auth_state')

    if (code && state === savedState) {
      handleCallback(code).then(() => {
        navigate('/')
      })
    } else {
      navigate('/')
    }
  }, [handleCallback, navigate])

  return <div>Processing authentication...</div>
}

export default AuthCallback
