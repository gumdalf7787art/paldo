import https from 'https';

const checkUrl = (url, label) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`\n--- ${label} ---`);
      console.log('Status code:', res.statusCode);
      if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
        const match = data.match(/src="(\/assets\/index-[^"]+\.js)"/);
        if (match) {
          console.log('Found script tag:', match[1]);
          const scriptUrl = new URL(match[1], url).toString();
          console.log('Fetching script:', scriptUrl);
          
          https.get(scriptUrl, (scriptRes) => {
            let scriptData = '';
            scriptRes.on('data', chunk => scriptData += chunk);
            scriptRes.on('end', () => {
              console.log('Script contains EASY_PAY:', scriptData.includes('EASY_PAY'));
              console.log('Script contains easy_pay:', scriptData.includes('easy_pay'));
            });
          });
        } else {
          console.log('No script tag found in HTML');
        }
      }
    });
  }).on('error', (e) => {
    console.error(label, 'error:', e.message);
  });
};

checkUrl('https://paldo-dog.pages.dev/ad-store', 'AdStore Route');
