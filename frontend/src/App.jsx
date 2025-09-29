import { useRef, useState } from 'react'
import { VOICES } from './voices.js'

function App() {
	const [text, setText] = useState('')
	const [isPlaying, setIsPlaying] = useState(false)
	const [voiceId, setVoiceId] = useState('Ashley')

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
			</div>
		</div>
	)
}

export default App
