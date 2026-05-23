const axios = require('axios');
axios.get('http://localhost:5000/api/clubs')
  .then(res => console.log('Clubs:', res.data))
  .catch(err => console.error('Error:', err.message));
