import https from 'https';

const checkUrl = () => {
  const url = 'https://a8f71c46.paldo-dog.pages.dev';
  https.get(url, (res) => {
    console.log(`[${new Date().toLocaleTimeString()}] Status:`, res.statusCode);
    if (res.statusCode === 200) {
      console.log('Successfully loaded!');
      process.exit(0);
    }
  }).on('error', (e) => {
    console.log('Error:', e.message);
  });
};

console.log('Starting check loop...');
setInterval(checkUrl, 10000);
checkUrl();
