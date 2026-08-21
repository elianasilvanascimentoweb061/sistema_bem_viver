// Importa a conexão com o serviço de autenticação
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged, //verifica se tem algum usuário logado
  signOut // pra sair
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


//PEGA OS ELEMENTOS DA PÁGINA
const botaoSair = document.getElementById("botaoSair");
const userNome = document.getElementById("emailUser");
const totalPacientes = document.getElementById("totalPacientes");
const totalFuncionarios = document.getElementById("totalFuncionarios");
const totalAtividades = document.getElementById("totalAtividades");
const atividadesLista = document.getElementById("atividadesLista");
const tabelaVazia = document.getElementById("tabelaVazia");


//Verifica autenticação - para que o usuário não consiga acessar a página sem fazer o login
onAuthStateChanged( auth, async (usuario) =>{
  if (!usuario) {
    window.location.href = "index.html";
    return;
  }
  //Mostra no console o usuário autenticado
  console.log("Usuário logado: ", usuario.email);
  userNome.textContent = usuario.email; //Mostra o email do usuário no dashboard
  //Busca os dados no firestore e atualiza os cards
  await carregarResumo();
});

//Botão sair
botaoSair.addEventListener("click", async () =>{
  try{
    await signOut(auth); //Encerra a sessão do usuário
    window.location.href ="index.html";
  }catch(error){
    console.error( "Erro ao sair:", error );
  }
});

//Carrega os cards
async function carregarResumo() {
  try {
    //Busca pacientes
    const pacientesSnapshot = await getDocs(collection(db, "pacientes"));
    //Busca funcionários
    const funcionariosSnapshot = await getDocs(collection(db, "funcionarios"));
    //Busca atividades
    const atividadesSnapshot = await getDocs(collection(db, "atividades"));

    //Atualiza os números dos cards
    totalPacientes.textContent = pacientesSnapshot.size;
    totalFuncionarios.textContent = funcionariosSnapshot.size;
    totalAtividades.textContent = atividadesSnapshot.size;

    //Carrega as atividades na tabela
    carregarProximasAtividades(atividadesSnapshot);
  } catch (error) {
    console.error("Erro ao carregar dados do Dashboard:", error);
  }
}

//Carrega próximas atividades
function carregarProximasAtividades(resultado) {
  //Limpa a lista
  atividadesLista.innerHTML = "";

  //Nenhuma atividade cadastrada no banco de dados
  if (resultado.empty) {
    tabelaVazia.style.display = "block";
    return;
  }
  tabelaVazia.style.display = "none";

  //Data atual
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  const dataHoje = `${ano}-${mes}-${dia}`;

  //Cria uma lista com as atividades
  const atividades = [];

  //Percorre as atividades do Firebase
  resultado.forEach((documento) => {
    const atividade = documento.data();
    //Mostra somente atividades de hoje e futuras
    if (atividade.dataAtividade && atividade.dataAtividade >= dataHoje) {
      atividades.push({id: documento.id, ...atividade});
    }
  });

  //Nenhuma atividade hoje ou futura
  if (atividades.length === 0) {
    atividadesLista.innerHTML = `
      <div class="tabela_vazia">
        <i class="fa-solid fa-calendar-check"></i>
        <h3>Nenhuma atividade próxima</h3>
        <p>
          Não existem atividades programadas para hoje ou para os próximos dias.
        </p>
      </div>
    `;
    return;
  }

  //Ordena por data e horário
  atividades.sort((a, b) => {
    const dataA = new Date(`${a.dataAtividade}T${a.horaAtividade || "00:00"}`);
    const dataB = new Date(`${b.dataAtividade}T${b.horaAtividade || "00:00"}`);
    return dataA - dataB;
  });

  //Mostra no máximo 5 atividades
  const proximasAtividades = atividades.slice(0, 5);

  //Cria cada atividade
  proximasAtividades.forEach((atividade) => {
    const item = document.createElement("div");
    item.className = "atividade_item";
    //Define se será hoje ou amanhã
    const diaAtividade = definirDia(atividade.dataAtividade);
    //Define manhã, tarde ou noite
    const periodo = definirPeriodo(atividade.horaAtividade);
    //Define o status 
    const status = definirStatus(atividade.status);

    item.innerHTML = `
      <!--Data-->
      <div class="atividade_data">
        <strong> ${diaAtividade} </strong>
        <span> ${formatarDataAtividade(atividade.dataAtividade)} </span>
      </div>
      <!--Horário-->
      <div class="atividade_hora">
        <strong> ${atividade.horaAtividade || "--:--"} </strong>
        <span> ${periodo} </span>
      </div>
      <!--Informações-->
      <div class="atividade_info">
        <h3> ${atividade.atividadeNome || "-"} </h3>
        <p> ${atividade.local || "Local não informado"} </p>
      </div>
      <!--Status-->
      <span class="atividade_status ${status.classe}"> 
        ${status.texto}
      </span>
    `;
    //Adiciona uma linha na tabela
    atividadesLista.appendChild(item);

  });
}

//Define hoje ou amanhã
function definirDia(data) {
  if (!data) {
    return "";
  }
  //Precisamos calcular a data atual novamente para usá-la
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  const dataHoje = `${ano}-${mes}-${dia}`;
  //Se a atividade for hoje
  if (data === dataHoje) {
    return "Hoje";
  }
  //Converte a data da atividade, a atual e a diferença em dias
  const dataAtividade = new Date(`${data}T00:00:00`);
  const dataAtual = new Date(`${dataHoje}T00:00:00`);
  const diferenca = Math.round(
    (dataAtividade - dataAtual) / (1000 * 60 * 60 * 24)
  );

  if (diferenca === 1) {
    return "Amanhã";
  }
  //Para os outros dias retornamos a própria data
  return formatarDataAtividade(data);
}

//Formata a data
function formatarDataAtividade(data){
  if(!data){
    return "";
  }
  const partes = data.split("-");
  if (partes.length != 3){
    return data;
  }
  //Retorna o dia e o mês 
  return `${partes[2]}/${partes[1]}`;
}

//Define o perído
function definirPeriodo(hora) {
  if (!hora) {
    return "";
  }

  //Pega somente a hora - 14:00 = 14
  const horaNumero = parseInt(hora.split(":")[0]);
  if (horaNumero < 12) {
    return "manhã";
  }
  if (horaNumero < 18) {
    return "tarde";
  }
  return "noite";
}

//Define o status
function definirStatus(status) {
  //Atividade concluída
  if (status === "Concluída") {
    return {texto: "Concluída", classe: "concluida"
    };
  }
  //Atividade em andamento
  if (status === "Em andamento") {
    return {texto: "Em andamento", classe: "andamento"};
  }
  //Atividade cancelada
  if (status == "Cancelada"){
    return {texto: "Cancelada", classe: "cancelada"};
  }
  // Atividade agendada
  return {
    texto: "Agendada", classe: "pendente"
  };
}
