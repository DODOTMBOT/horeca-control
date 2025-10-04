import fetch from 'node-fetch'

async function testAPI() {
  try {
    console.log('Testing API...')
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
    })
    
    const data = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', data)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testAPI()
