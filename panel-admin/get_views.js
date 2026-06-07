const fs = require('fs');

async function fetchSchema() {
  const url = 'https://pzhiapfwwkidutqdrrvm.supabase.co/rest/v1/';
  const response = await fetch(url, {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aGlhcGZ3d2tpZHV0cWRycnZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDI5NCwiZXhwIjoyMDk0OTY2Mjk0fQ.bR7T6mG46vOa2IFQhZHrMwMSuUdghaS12UEaQb57VI4',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aGlhcGZ3d2tpZHV0cWRycnZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDI5NCwiZXhwIjoyMDk0OTY2Mjk0fQ.bR7T6mG46vOa2IFQhZHrMwMSuUdghaS12UEaQb57VI4'
    }
  });
  const data = await response.json();
  
  fs.writeFileSync('schema.json', JSON.stringify(data, null, 2));
}

fetchSchema().catch(console.error);
