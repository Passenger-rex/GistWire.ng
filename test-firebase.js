import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, limit } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

async function run() {
    const q = query(collection(db, "articles"), limit(1));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        console.log(doc.data().slug);
    });
}
run();
