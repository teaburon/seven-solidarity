const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function get(path){
  const res = await fetch(
    API + path, { credentials: 'include' }
)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function post(path, body){
  const res = await fetch(
    API + path, { 
        method: 'POST',
        credentials: 'include', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify(body) 
    }
)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function put(path, body){
  const res = await fetch(
    API + path, { 
        method: 'PUT', 
        credentials: 'include', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify(body) 
    }
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export { get, post, put }