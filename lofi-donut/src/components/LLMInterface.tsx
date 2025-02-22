import { useState, useEffect, useRef } from 'react'
import { LLM_CONFIG, MAP_AREAS } from '../constants'
import { StoredMap, LLMResponse } from '../types/map'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface LLMInterfaceProps {
  selectedArea: string | null
  storedMaps: StoredMap[]
}

export default function LLMInterface({ selectedArea, storedMaps }: LLMInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Reset chat when area changes
  useEffect(() => {
    if (selectedArea) {
      const area = MAP_AREAS.find(a => a.id === selectedArea)
      if (area) {
        const initialMessage: Message = {
          role: 'assistant',
          content: `Hi! I can help you learn about ${area.name}. What would you like to know?`,
          timestamp: Date.now()
        }
        setMessages([initialMessage])
      }
    } else {
      setMessages([{
        role: 'assistant',
        content: 'Please select an area to begin chatting.',
        timestamp: Date.now()
      }])
    }
  }, [selectedArea])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedArea) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const area = MAP_AREAS.find(a => a.id === selectedArea)!
      const storedMap = storedMaps.find(m => m.id === selectedArea)
      
      // Prepare context for the LLM
      const context = {
        area_name: area.name,
        landmarks: area.landmarks.join(', '),
        description: area.description,
        has_local_data: Boolean(storedMap),
        bounds: area.bounds
      }

      const response = await fetch(`${LLM_CONFIG.endpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LLM_CONFIG.model,
          prompt: `
Context: You are a local guide for ${area.name} in San Francisco.
Area Details: ${JSON.stringify(context)}
Previous Messages: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
User Question: ${input}

Provide a helpful response about this specific area. If the question is about location or navigation, reference the landmarks.
`,
          temperature: LLM_CONFIG.temperature,
          max_tokens: 150,
          stop: ['\n\n']
        })
      })

      if (!response.ok) throw new Error('Failed to get LLM response')
      
      const data = await response.text()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('LLM error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div 
        ref={chatRef}
        className="flex-1 overflow-y-auto mb-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {messages.map((message, i) => (
          <div
            key={message.timestamp}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-50">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={sendMessage} className="mt-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedArea ? "Ask about this area..." : "Select an area first"}
            disabled={!selectedArea || isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!selectedArea || !input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}