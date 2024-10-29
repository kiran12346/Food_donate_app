
// import { initializeApp } from "firebase/app";

// const firebaseConfig = {
//   apiKey: "AIzaSyBO3elV076LfV7dxwL-AzMyaFPahPz_GTI",
//   authDomain: "plateshare-debe4.firebaseapp.com",
//   projectId: "plateshare-debe4",
//   storageBucket: "plateshare-debe4.appspot.com",
//   messagingSenderId: "675782368793",
//   appId: "1:675782368793:web:8ccc633cb0619016fe5488"
// };


// const app = initializeApp(firebaseConfig);
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBO3elV076LfV7dxwL-AzMyaFPahPz_GTI",
  authDomain: "plateshare-debe4.firebaseapp.com",
  databaseURL: "https://plateshare-debe4-default-rtdb.firebaseio.com",
  projectId: "plateshare-debe4",
  storageBucket: "plateshare-debe4.appspot.com",
  messagingSenderId: "675782368793",
  appId: "1:675782368793:web:8ccc633cb0619016fe5488"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
