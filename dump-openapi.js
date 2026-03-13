require('dotenv').config();
const fs = require('fs');

async function dumpOpenAPI() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/`;
  
  try {
      const response = await fetch(url, {
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      const spec = await response.json();
      fs.writeFileSync('openapi-full.json', JSON.stringify(spec, null, 2));
      console.log('Full spec dumped to openapi-full.json');
  } catch (err) {
      console.error('Error:', err.message);
  }
}

dumpOpenAPI();
