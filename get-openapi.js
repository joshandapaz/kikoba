require('dotenv').config();

async function getOpenAPI() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/`;
  console.log('Fetching from:', url);
  
  try {
      const response = await fetch(url, {
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch OpenAPI:', await response.text());
        return;
      }

      const spec = await response.json();
      const definitions = spec.definitions || spec.components?.schemas || {};
      console.log('Tables in Specs:', Object.keys(definitions));
      
      // Look for payments definition
      const paymentsDef = definitions['payments'];
      if (paymentsDef) {
        console.log('Payments Definition Found!');
        const properties = paymentsDef.properties || {};
        console.log('Payments Columns:', Object.keys(properties));
      } else {
        console.log('Payments NOT in OpenAPI spec');
      }
  } catch (err) {
      console.error('Error:', err.message);
  }
}

getOpenAPI();
