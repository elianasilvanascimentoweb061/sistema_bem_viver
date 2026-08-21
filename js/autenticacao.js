// Importa a conexão com o serviço de autenticação
import { auth } from "./firebase.js";
// Importa as funços para fazer o login
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
// Pega os elementos do formulário
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("senha");
const loginButton = document.getElementById("loginBotao");
const loginMessage = document.getElementById("loginMensagem");
const mostrarSenha = document.getElementById("mostrarSenha");

//Mostrar/esconder senha
mostrarSenha.addEventListener("click", () => {
  const senhaVisivel = passwordInput.type === "text";
  //Localiza o icone dentro do botão
  const icone = mostrarSenha.querySelector("i")
  if (senhaVisivel) {
    // Esconde a senha novamente
    passwordInput.type = "password";
    icone.classList.remove("fa-eye-slash");
    icone.classList.add("fa-eye");
    mostrarSenha.setAttribute("aria-label", "Mostrar senha");
  }else {
    // Mostra a senha
    passwordInput.type = "text";
    icone.classList.remove("fa-eye");
    icone.classList.add("fa-eye-slash");
    mostrarSenha.setAttribute("aria-label", "Esconder senha");
  }

});

//Verificar se o usuário já esta logado
onAuthStateChanged(
  auth, async (usuario) => {
    if (usuario) {
      window.location.href = "dashboard.html";
    }
  }
);

//Processar o login
loginForm.addEventListener("submit", async(event) =>{
  event.preventDefault();
  //Recupera os dados digitados
  const email = emailInput.value.trim();
  const senha = passwordInput.value;

  if (!email || !senha) {
    mostrarMensagem(
      "Preencha todos os campos.",
      "error"
    );
    return;
  }
  try{
    loginButton.disabled = true;
    loginButton.textContent ="Entrando...";
    //Envia o email e a senha para o firebase authentication
    await signInWithEmailAndPassword( auth, email, senha);
    mostrarMensagem(
      "Login realizado com sucesso!",
      "success"
    );
    window.location.href = "dashboard.html";

  }catch (error){
    console.error("Erro no login:", error);
    let mensagem = "Não foi possível realizar o login.";
    switch (error.code){
      case "auth/invalid-credential":
        mensagem = "E-mail ou senha incorretos.";
        break;
      case "auth/invalid-email":
        mensagem = "Digite um e-mail válido.";
        break;
    }

    mostrarMensagem( mensagem,"error");
    //Libera o botão de entrar novamente
    loginButton.disabled = false; 
    loginButton.textContent = "Entrar";
  }
});

//Função para evitar repetir o mesmo código da mensagem várias vezes
function mostrarMensagem( mensagem, tipo) {
  loginMessage.textContent = mensagem;
  //Adiciona as classes: login-message error ou login-message success
  loginMessage.className = `login_menssagem ${tipo}`;
}