const https = require('https');

https.get('https://acetkeyzhbgfsetwkfuo.supabase.co/rest/v1/', (res) => {
  console.log('Status Code:', res.statusCode);
}).on('error', (e) => {
  console.error('Error:', e.message);
});
