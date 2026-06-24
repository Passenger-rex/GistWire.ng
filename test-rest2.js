import fs from "fs";

async function run() {
    const configPath = "firebase-applet-config.json";
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const projectId = config.projectId;
    const databaseId = config.firestoreDatabaseId || "(default)";
    
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery?key=${config.apiKey}`;
    
    console.log("Fetching", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "articles" }],
          limit: 1
        }
      })
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

run();
