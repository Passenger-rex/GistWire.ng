import fs from "fs";

async function run() {
    const configPath = "firebase-applet-config.json";
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const projectId = config.projectId;
    const databaseId = config.firestoreDatabaseId || "(default)";
    
    // Testing with an arbitrary slug. Assuming there's some articles.
    const slug = "test-article"; // Will change it to a real one or just let it return empty.
    
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
    
    console.log("Fetching", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "articles" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "slug" },
              op: "EQUAL",
              value: { stringValue: slug }
            }
          },
          limit: 1
        }
      })
    });
    
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

run();
