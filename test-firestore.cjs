const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const config = require("./firebase-applet-config.json");

const app = initializeApp(config);
const db = getFirestore(app, "(default)");

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, "articles"));
    console.log("Success! Docs:", querySnapshot.size);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
