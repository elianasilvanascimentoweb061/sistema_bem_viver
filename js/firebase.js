// Importa a função responsável por inicializar o Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
// Importa o serviço de autenticação
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
// Importa o banco de dados Firestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

//Configurações do firebase
const firebaseConfig = {
  apiKey: "AIzaSyCJP8HiOLnjNLNqOOehpZeC4IeEalKZ1H4",
  authDomain: "bem-viver-86c74.firebaseapp.com",
  projectId: "bem-viver-86c74",
  storageBucket: "bem-viver-86c74.firebasestorage.app",
  messagingSenderId: "747792319511",
  appId: "1:747792319511:web:92db4fcb70eb9eb5008852",
  measurementId: "G-H6QDWLW8ZF"
};

//Inicialização
const app = initializeApp(firebaseConfig);

//Conectar com o serviço de autenticação
export const auth = getAuth(app);
//Conectar com o firestore
export const db = getFirestore(app);