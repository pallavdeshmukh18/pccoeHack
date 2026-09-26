fetch('http://localhost:5001/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ credential: 'fake_token' })
})
  .then(res => res.json().then(data => console.log(res.status, data)))
  .catch(err => console.log('Error:', err.message));
