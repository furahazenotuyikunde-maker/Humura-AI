const https = require('https');

https.get('https://acetkeyzhbgfsetwkfuo.supabase.co/rest/v1/', (res) => {
  console.log('Supabase Status Code:', res.statusCode);
  if (res.statusCode === 503) {
    console.log('Project is paused/sleeping!');
  }
}).on('error', (e) => {
  console.error('Error reaching Supabase:', e.message);
});
