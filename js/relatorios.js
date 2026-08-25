// Importa o Authentication e o Firestore que já foram configurados no firebase.js
import {auth, db} from "./firebase.js";
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

const totalResidentes = document.getElementById("totalResidentes");
const totalFuncionarios = document.getElementById("totalFuncionarios");
const totalAtividades = document.getElementById("totalAtividades");

const totalAgendadas = document.getElementById("totalAgendadas");
const totalAndamento = document.getElementById("totalAndamento");
const totalConcluidas = document.getElementById("totalConcluidas");
const totalCanceladas = document.getElementById("totalCanceladas");

const cargosLista = document.getElementById("cargosLista");
const atividadesTb = document.getElementById("atividadesTb");

//Verifica autenticação - para que o usuário não consiga acessar a página sem fazer o login
onAuthStateChanged( auth, async (usuario) =>{
  if (!usuario) {
    window.location.href = "index.html";
    return;
  }
  //Mostra no console o usuário autenticado
  console.log("Usuário logado: ", usuario.email);
  userNome.textContent = usuario.email; //Mostra o email do usuário no dashboard
  //Busca os dados no firestore e atualiza os relatorios
  await carregarRelatorios();
});

//Carrega todos os relatórios
async function carregarRelatorios() {
  try{
    //Busca os três conjuntos de dados
    const residentesSnapshot = await getDocs(collection(db, "residentes"));
    const funcionariosSnapshot = await getDocs(collection(db, "funcionarios"));
    const atividadesSnapshot = await getDocs(collection(db, "atividades"));

    //Atualiza os cards de resumo
    totalResidentes.textContent = residentesSnapshot.size;
    totalFuncionarios.textContent = funcionariosSnapshot.size;
    totalAtividades.textContent = atividadesSnapshot.size;

    //Relatórios dos status, cargos e atividades
    carregarStatusAtividades(atividadesSnapshot);
    carregarCargos(funcionariosSnapshot);
    carregarTabelaAtividades(atividadesSnapshot);
  }catch(error){
    console.error("Erro ao carregar relatórios:", error);
  }
}

//Status das atividades
function carregarStatusAtividades(resultado) {
  //Contadores - a quantidade vai acumulando a cada atividade adicionada
  let agendadas = 0;
  let andamento = 0;
  let concluidas = 0;
  let canceladas = 0;

  resultado.forEach((documento) => {
    const atividade = documento.data();
    const status = atividade.status;

    if (status === "Agendada") {
      agendadas++;
    }
    else if (status === "Em andamento") {
      andamento++;
    }
    else if (status === "Concluída") {
      concluidas++;
    }
    else if (status === "Cancelada") {
      canceladas++;
    }
  });

  //Coloca os números no painel
  totalAgendadas.textContent = agendadas;
  totalAndamento.textContent = andamento;
  totalConcluidas.textContent = concluidas;
  totalCanceladas.textContent = canceladas;
}

//Quantidade de funcionários por cargo
function carregarCargos(resultado) {
  cargosLista.innerHTML = "";
  const cargos = {};

  resultado.forEach((documento) => {
    const funcionario = documento.data();
    const cargo = funcionario.cargo || "Não informado";
    //Se o cargo ainda não existe
    if (!cargos[cargo]) {
      cargos[cargo] = 0;
    }
    //Adiciona mais um funcionário
    cargos[cargo]++;
  });

  //Transforma o objeto em lista
  Object.entries(cargos).forEach(([cargo, quantidade]) => {
    const item = document.createElement("div");
    item.className = "cargo_item";
    item.innerHTML = `
      <span>${cargo}</span>
      <strong>${quantidade}</strong>
    `;
    cargosLista.appendChild(item);
  });
}

//Tabela de atividades
function carregarTabelaAtividades(resultado) {
  atividadesTb.innerHTML = "";


  if (resultado.empty) {
    atividadesTb.innerHTML = `
      <tr>
        <td colspan="5">
          Nenhuma atividade cadastrada.
        </td>
      </tr>
    `;
    return;
  }

  resultado.forEach((documento) => {
    const atividade = documento.data();
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td> ${atividade.atividadeNome || "-"} </td>
      <td> ${formatarData(atividade.dataAtividade)} </td>
      <td> ${atividade.horaAtividade || "-"} </td>
      <td> ${atividade.responsavelNome || "-"} </td>
      <td> ${atividade.status || "-"} </td>
    `;

    atividadesTb.appendChild(linha);
  });
}

//Formatar data
function formatarData(data){
  if (!data) {
    return "-";
  }
  const partes = data.split("-");
  //Verifica se a data tá correta
  if (partes.length !== 3) {
    return data;
  }
  //Converte para dd/mm/aa
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

//Botão sair
botaoSair.addEventListener("click", async () =>{
  try{
    await signOut(auth); //Encerra a sessão do usuário
    window.location.href ="index.html";
  }catch(error){
    console.error( "Erro ao sair:", error );
  }
});