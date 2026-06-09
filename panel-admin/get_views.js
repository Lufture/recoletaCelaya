const fs = require('fs');

async function fetchSchema() {
  const url = 'https://pzhiapfwwkidutqdrrvm.supabase.co/rest/v1/';
  const response = await fetch(url, {
    headers: {

    }
  });
  const data = await response.json();

  fs.writeFileSync('schema.json', JSON.stringify(data, null, 2));
}

fetchSchema().catch(console.error);
