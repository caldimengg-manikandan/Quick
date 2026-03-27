import { getTokens, setTokens } from "../state/auth/tokens.js"
import { isJwtExpired } from "../state/auth/jwt.js"
import { getMock } from "./mockData.js"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api"

// Track offline state so banner can be shown once
let _offline = false
export function isOffline() { return _offline }

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) }
  catch { return text }
}

async function refreshAccessToken(tokens) {
  const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh })
  })
  if (!res.ok) return null
  const data = await safeJson(res)
  if (!data?.access) return null
  return { ...tokens, access: data.access }
}

export async function apiRequest(path, init = {}, attemptRefresh = true) {
  const tokens = getTokens()
  const headers = new Headers(init.headers ?? {})
  if (!headers.has("Content-Type") && init.json !== undefined) headers.set("Content-Type", "application/json")
  if (tokens?.access) headers.set("Authorization", `Bearer ${tokens.access}`)

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body
    })

    if (res.status === 401 && attemptRefresh && tokens?.refresh && tokens.access && isJwtExpired(tokens.access)) {
      const nextTokens = await refreshAccessToken(tokens)
      if (nextTokens) {
        setTokens(nextTokens)
        return apiRequest(path, init, false)
      }
      setTokens(null)
    }

    if (!res.ok) {
      const err = { status: res.status, body: await safeJson(res) }
      // On server errors (5xx) or 404, try mock fallback for GET requests
      if ((res.status >= 500 || res.status === 404) && (!init.method || init.method === "GET")) {
        const mock = getMock(path)
        if (mock !== null) { _offline = true; return mock }
      }
      throw err
    }

    _offline = false
    return safeJson(res)

  } catch (err) {
    // Network failure (backend completely down) → use mock data for reads
    if (err && typeof err === "object" && "status" in err) {
      // Already a structured API error – re-throw
      throw err
    }
    // TypeError / network failure
    const mock = getMock(path)
    if (mock !== null) {
      _offline = true
      // For mutation requests (POST/DELETE), return a fake 200 success
      if (init.method && init.method !== "GET") {
        return { ok: true, mock: true }
      }
      return mock
    }
    throw err
  }
}

export function unwrapResults(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === "object" && Array.isArray(value.results)) return value.results
  return []
}
