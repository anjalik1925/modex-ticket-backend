const axios = require('axios');

const N = 100; // number of concurrent requests
async function runTest() {
  const promises = [];
  for (let i = 0; i < N; i++) {
    promises.push(
      axios.post('http://localhost:3000/api/shows/1/book', {
        user_id: 'lt_user_' + i,
        seats_requested: 1
      }).then(r => r.data).catch(e => e.response?.data || e.message)
    );
  }
  const results = await Promise.all(promises);
  console.log('Results:', results.map(r => r.status || r));
}
runTest();
