const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function withApiPrefix(path) {
  if (path.startsWith('/api/')) return path
  if (path.startsWith('/auth')) return path // don't prefix auth routes
  return '/api' + (path.startsWith('/') ? path : '/' + path)
}

async function get(path){
  const res = await fetch(
    API + withApiPrefix(path), { credentials: 'include' }
  )
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorData.error || `Error ${res.status}`)
  }
  return res.json()
}

async function post(path, body){
  const res = await fetch(
    API + withApiPrefix(path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  )
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorData.error || `Error ${res.status}`)
  }
  return res.json()
}

async function put(path, body){
  const res = await fetch(
    API + withApiPrefix(path), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  )
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorData.error || `Error ${res.status}`)
  }
  return res.json()
}

export { get, post, put }