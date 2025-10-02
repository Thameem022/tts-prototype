import { useRef, useState } from 'react'
import { VOICES, sendGeminiChat } from './voices.js'

function App() {
	const [text, setText] = useState('')
	const [isPlaying, setIsPlaying] = useState(false)
	const [voiceId, setVoiceId] = useState('Ashley')
	const [chatInput, setChatInput] = useState('')
	const [messages, setMessages] = useState([])

	// Fixed values (no UI controls)
	const modelId = 'inworld-tts-1'
	const sampleRate = 48000

	const audioCtxRef = useRef(null)
	const wsRef = useRef(null)

	const getWsUrl = () => {
		if (typeof window === 'undefined') return 'ws://localhost:8000/ws/tts'
		const scheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
		return `${scheme}${window.location.host}/ws/tts`
	}

	const startTTS = () => {
		if (!text || isPlaying) return

		if (!audioCtxRef.current) {
			audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
		}
		if (audioCtxRef.current.state === 'suspended') {
			audioCtxRef.current.resume()
		}

		const ws = new WebSocket(getWsUrl())
		wsRef.current = ws

		ws.onopen = () => {
			ws.send(
				JSON.stringify({
					text,
					voiceId,
					modelId,
					audio_config: {
						audio_encoding: 'LINEAR16',
						sample_rate_hertz: Number(sampleRate)
					}
				})
			)
			setIsPlaying(true)
		}

		ws.onmessage = async (event) => {
			if (typeof event.data === 'string' && event.data.startsWith('{')) {
				console.error('Error:', event.data)
				return
			}

			const base64 = event.data
			const binary = atob(base64)
			const buffer = new ArrayBuffer(binary.length)
			const view = new Uint8Array(buffer)
			for (let i = 0; i < binary.length; i++) {
				view[i] = binary.charCodeAt(i)
			}

			const int16Array = new Int16Array(buffer)
			const float32Array = new Float32Array(int16Array.length)
			for (let i = 0; i < int16Array.length; i++) {
				float32Array[i] = int16Array[i] / 32768
			}

			const audioBuffer = audioCtxRef.current.createBuffer(1, float32Array.length, Number(sampleRate))
			audioBuffer.copyToChannel(float32Array, 0)
			const source = audioCtxRef.current.createBufferSource()
			source.buffer = audioBuffer
			source.connect(audioCtxRef.current.destination)
			source.start()
		}

		ws.onclose = () => setIsPlaying(false)
		ws.onerror = () => setIsPlaying(false)
	}

	const stop = () => {
		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}
		setIsPlaying(false)
	}

	const sendChat = async () => {
		const content = chatInput.trim()
		if (!content) return
		const nextMessages = [...messages, { role: 'user', content }]
		setMessages(nextMessages)
		setChatInput('')
		const res = await sendGeminiChat(nextMessages)
		if (res?.reply) {
			setMessages((prev) => [...prev, { role: 'model', content: res.reply }])
		}
	}

	return (
		<div className="container">
			<div className="header">
				<div className="brand">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect x="3" y="3" width="18" height="18" rx="4" fill="#7c5cff" opacity="0.25"/>
						<path d="M8 12h2l2 4 2-8 2 4h2" stroke="#7c5cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
					<span>Realtime TTS</span>
				</div>
			</div>

			<div className="grid">
				<div className="card">
					<div className="section-title">Input</div>
					<textarea
						className="textarea"
						rows={8}
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Type something to speak..."
					/>
					<div className="controls">
						<button className="button" onClick={startTTS} disabled={isPlaying || !text.trim()}>Speak</button>
						<button className="button secondary" onClick={stop} disabled={!isPlaying}>Stop</button>
					</div>
				</div>

				<div className="card">
					<div className="section-title">Settings</div>
					<div className="kv">
						<label>
							<div className="section-title">Voice</div>
							<select className="input" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
								{VOICES.map((v) => (
									<option key={v.voiceId} value={v.voiceId}>{v.displayName} · {v.voiceId}</option>
								))}
							</select>
						</label>
					</div>
				</div>

				<div className="card">
					<div className="section-title">Gemini Chat</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
						<div style={{
							border: '1px solid rgba(255,255,255,0.08)',
							borderRadius: 8,
							padding: 12,
							height: 240,
							overflow: 'auto',
							background: 'rgba(255,255,255,0.02)'
						}}>
							{messages.length === 0 && (
								<div style={{ opacity: 0.6 }}>Ask anything and the Gemini bot will reply.</div>
							)}
							{messages.map((m, idx) => (
								<div key={idx} style={{ marginBottom: 8 }}>
									<strong>{m.role === 'user' ? 'You' : 'Gemini'}:</strong> {m.content}
								</div>
							))}
						</div>
						<div style={{ display: 'flex', gap: 8 }}>
							<input
								className="input"
								placeholder="Type a message..."
								value={chatInput}
								onChange={(e) => setChatInput(e.target.value)}
							/>
							<button className="button" onClick={sendChat}>Send</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default App
