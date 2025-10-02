export const VOICES = [
	{ voiceId: 'Alex', displayName: 'Alex', description: 'Energetic and expressive mid-range male; mildly nasal' },
	{ voiceId: 'Ashley', displayName: 'Ashley', description: 'A warm, natural female voice' },
	{ voiceId: 'Craig', displayName: 'Craig', description: 'Older British male; refined and articulate' },
	{ voiceId: 'Deborah', displayName: 'Deborah', description: 'Gentle and elegant female voice' },
	{ voiceId: 'Dennis', displayName: 'Dennis', description: 'Middle-aged man; smooth, calm and friendly' },
	{ voiceId: 'Edward', displayName: 'Edward', description: 'Fast-talking, emphatic, streetwise male' },
	{ voiceId: 'Elizabeth', displayName: 'Elizabeth', description: 'Professional middle-aged woman; great for narrations' },
	{ voiceId: 'Hades', displayName: 'Hades', description: 'Commanding, gruff male; omniscient narrator vibe' },
	{ voiceId: 'Julia', displayName: 'Julia', description: 'Quirky, high-pitched female with playful energy' },
	{ voiceId: 'Pixie', displayName: 'Pixie', description: 'High-pitched, childlike, squeaky; cartoon feel' },
	{ voiceId: 'Mark', displayName: 'Mark', description: 'Energetic, expressive male; rapid-fire delivery' },
	{ voiceId: 'Olivia', displayName: 'Olivia', description: 'Young British female; upbeat and friendly' },
	{ voiceId: 'Priya', displayName: 'Priya', description: 'Even-toned female with an Indian accent' },
	{ voiceId: 'Ronald', displayName: 'Ronald', description: 'Confident British male; deep, gravelly' },
	{ voiceId: 'Sarah', displayName: 'Sarah', description: 'Fast-talking young adult woman; curious tone' },
	{ voiceId: 'Shaun', displayName: 'Shaun', description: 'Friendly, dynamic male; great for conversations' },
	{ voiceId: 'Theodore', displayName: 'Theodore', description: 'Gravelly male; time-worn quality' },
	{ voiceId: 'Timothy', displayName: 'Timothy', description: 'Lively, upbeat American male voice' },
	{ voiceId: 'Wendy', displayName: 'Wendy', description: 'Posh, middle-aged British female voice' },
	{ voiceId: 'Dominus', displayName: 'Dominus', description: 'Robotic, deep male; menacing; villain-ready' }
]

export async function sendGeminiChat(messages, options = {}) {
	const base = typeof window === 'undefined'
		? 'http://localhost:8000'
		: `${window.location.origin}`

	const res = await fetch(`${base}/api/gemini/chat`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ messages, ...options })
	})
	const data = await res.json()
	return data
}
