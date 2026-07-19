const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_BASE = 'https://api.groq.com/openai/v1'
const MODEL = 'llama-3.3-70b-versatile'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if ((e?.status === 429 || e?.message?.includes('rate')) && i < retries - 1) {
        const wait = (i + 1) * 5000
        console.log(`Rate limited, retrying in ${wait}ms...`)
        await delay(wait)
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

async function groqChat(system: string, user: string): Promise<string> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Groq chat error:', res.status, body)
    const err = new Error(`Groq API error: ${res.status}`) as Error & { status: number }
    err.status = res.status
    throw err
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

const GEMINI_VISION_KEY = process.env.GOOGLE_AI_API_KEY || ''
const GEMINI_VISION_MODEL = 'gemini-3.1-flash-lite'

async function geminiVision(prompt: string, base64Image: string, mediaType: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${GEMINI_VISION_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mediaType, data: base64Image } },
          ],
        }],
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    console.error('Gemini vision error:', res.status, body)
    const err = new Error(`Gemini vision API error: ${res.status}`) as Error & { status: number }
    err.status = res.status
    throw err
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function callGemini(system: string, user: string): Promise<string> {
  return retryWithBackoff(() => groqChat(system, user))
}

export async function callGeminiJSON<T>(system: string, user: string): Promise<T> {
  const raw = await callGemini(
    system + '\n\nRespond ONLY with valid JSON. No markdown. No code blocks. No explanation. No preamble.',
    user
  )
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned) as T
}

export async function callGeminiVision(
  prompt: string,
  base64Image: string,
  mediaType: string
): Promise<string> {
  return retryWithBackoff(() => geminiVision(prompt, base64Image, mediaType))
}

export async function callGeminiVisionJSON<T>(
  prompt: string,
  base64Image: string,
  mediaType: string
): Promise<T> {
  const raw = await callGeminiVision(
    prompt + '\n\nRespond ONLY with valid JSON. No markdown. No code blocks. No explanation.',
    base64Image,
    mediaType
  )
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    return JSON.parse(cleaned.slice(start, end + 1)) as T
  }
  return JSON.parse(cleaned) as T
}
