// Importa o Authentication e o Firestore que já foram configurados no firebase.js
import {auth, db} from "./firebase.js";
import {
  onAuthStateChanged, //verifica se tem algum usuário logado
  signOut // pra sair
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
// Funções pra trabalhar com documentos do Firestore
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

//PEGA OS ELEMENTOS DA PÁGINA
const botaoSair = document.getElementById("botaoSair");
const userNome = document.getElementById("emailUser");
const cancelarBotao = document.getElementById("cancelarBotao");
const botaoSalvar = document.getElementById("botaoSalvar");
//Corpo da tabela
const atividadesTb = document.getElementById("atividadesTb");
//Formulário
const atividadeForm = document.getElementById("atividadeForm");
//Mensagem exibida quando não existem atividades
const tabelaVazia = document.getElementById("tabelaVazia");

//Campos do formulário
const atividadeInput = document.getElementById("atividadeNome");
const tipoSelect = document.getElementById("tipo");
const dataAtividadeInput = document.getElementById("dataAtividade");
const horaAtividadeInput = document.getElementById("horaAtividade");
const responsavelSelect = document.getElementById("responsavel");
const localInput = document.getElementById("local");
const statusSelect = document.getElementById("status");
const observacoesInput = document.getElementById("observacoes");

//Controle de edição
//Quando for null =  cadastro, quando tiver um id = edição
let atividadeEditandoId = null;

//Verifica autenticação - para que o usuário não consiga acessar a página sem fazer o login
onAuthStateChanged(auth, async (usuario) =>{
  if (!usuario) {
    window.location.href = "index.html";
    return;
  }
  //Mostra no console o usuário autenticado
  console.log("Usuário logado: ", usuario.email);
  userNome.textContent = usuario.email; //Mostra o email do no dashboard
  await carregarFuncionarios(); //Pega os funcionários cadastrados no banco e coloca no select
  await carregarAtividades(); //Carrega atividades do banco
});

//Carregar funcionários no select
async function carregarFuncionarios() {
  try {
    const resultado = await getDocs(collection(db, "funcionarios"));
    //Limpa as opções anteriores
    responsavelSelect.innerHTML = `
      <option value="">Selecione o responsável</option>
    `;

    //Verifica se existem funcionários
    if (resultado.empty) {
      responsavelSelect.innerHTML = `
        <option value="">
          Nenhum funcionário cadastrado
        </option>
      `;
      return;
    }

    //Adiciona os funcionários
    resultado.forEach((documento) => {
      const funcionario = documento.data();
      const opcao = document.createElement("option");
      opcao.value = documento.id;
      opcao.textContent = funcionario.nome || "Funcionário sem nome";

      //Guarda o nome também
      opcao.dataset.nome = funcionario.nome || "";
      responsavelSelect.appendChild(opcao);
    });

  } catch (error) {
    console.error("Erro ao carregar funcionários:", error);
  }

}

//Cancelar cadastro
cancelarBotao.addEventListener("click", () => {
  //Limpa todos os campos
  atividadeForm.reset();
  //Sai do modo edição
  atividadeEditandoId = null;
  //Novo cadastro começa como Agendada
  statusSelect.value = "Agendada";
  botaoSalvar.disabled = false;
  botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar atividade';
});

//Salvar ou Atualizar paciente - Junta o cadastrar e o editar em uma única lógica
atividadeForm.addEventListener("submit", async (event) =>{
  //Evita que o navegador recarregue a página
  event.preventDefault();

  try{
    botaoSalvar.disabled = true; 
    botaoSalvar.textContent = "Salvando...";

    //Pega o funcionário selecionado
    const funcionarioSelecionado = responsavelSelect.options[responsavelSelect.selectedIndex];
    const responsavelId = responsavelSelect.value;
    const responsavelNome = funcionarioSelecionado 
      ? funcionarioSelecionado.dataset.nome: "";


    //Modo edição
    if(atividadeEditandoId){
      await updateDoc(doc(db, "atividades", atividadeEditandoId),{
        //Atualiza o documento
        atividadeNome: atividadeInput.value.trim(),
        tipo: tipoSelect.value,
        dataAtividade: dataAtividadeInput.value,
        horaAtividade: horaAtividadeInput.value,
        responsavelId: responsavelId,
        responsavelNome: responsavelNome,
        local: localInput.value.trim(),
        status: statusSelect.value,
        observacoes: observacoesInput.value.trim(),
      });
      alert("Atividade atualizada com sucesso!");
    }else{
      //Novo cadastro
      await addDoc(collection(db, "atividades"),{
        atividadeNome: atividadeInput.value.trim(),
        tipo: tipoSelect.value,
        dataAtividade: dataAtividadeInput.value,
        horaAtividade: horaAtividadeInput.value,
        responsavelId: responsavelId,
        responsavelNome: responsavelNome,
        local: localInput.value.trim(),
        status: statusSelect.value,
        observacoes: observacoesInput.value.trim(),
        //Registra quando o cadastro foi realizado
        dataCadastro: serverTimestamp()
      });
      alert("Atividade cadastrada com sucesso!");
    }
    //Limpa o formulário
    atividadeForm.reset();
    atividadeEditandoId = null;
    statusSelect.value = "Agendada";
    botaoSalvar.disabled = false;
    botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar atividade';

    //Atualiza a tabela
    await carregarAtividades();

  }catch (error){
    console.error("Erro ao salvar atividade: ", error);
    alert("Não foi possível salvar a atividade.");
    botaoSalvar.disabled = false;
    botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar atividade';
  }
});//Fim salvar ou Atualizar atividade

//Carregar atividades
async function carregarAtividades(){
  try{
    //Proura os documentos existentes na lista de atividades
    const resultado = await getDocs(collection(db,"atividades"));
    atividadesTb.innerHTML = "";

    //Nenhuma atividade
    if (resultado.empty) {
      tabelaVazia.style.display = "block";
      return;
    }
    tabelaVazia.style.display = "none";

    //Preencher tabela
    resultado.forEach((documento) =>{
      //Pega os dados do documento
      const atividade = documento.data();
      //Cria uma nova linha
      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td> ${atividade.atividadeNome || "-"} </td>
        <td> ${formatarData(atividade.dataAtividade)} </td>
        <td> ${atividade.horaAtividade || "-"} </td>
        <td> ${atividade.responsavelNome || "-"} </td>
        <td> ${atividade.status || "-"} </td>
        <td>
          <button
            class="table_action editar"
            data-id="${documento.id}"
            title="Editar atividade"
            type="button"
          >
            <i class="fa-solid fa-pen"></i>
          </button>

          <button
            class="table_action excluir"
            data-id="${documento.id}"
            title="Excluir atividade"
            type="button"
          >
            <i class="fa-solid fa-trash"></i>
          </button>

        </td>
      `;
      //Adiciona uma linha na tabela
      atividadesTb.appendChild(linha);
    });

    adicionarEventosBotoes();

  }catch(error){
    console.error("Erro ao carregar atividades:", error);
  }
}//Fim carregar atividades

//Botões editar e excluir
function adicionarEventosBotoes(){
  const botoesEditar = document.querySelectorAll(".editar");
  const botoesExcluir = document.querySelectorAll(".excluir");

  //Editar
  botoesEditar.forEach((botao) => {
    botao.addEventListener("click",() => {
      editarAtividade(botao.dataset.id);
    });
  });

  //Excluir
  botoesExcluir.forEach((botao) => {
    botao.addEventListener("click",() => {
      excluirAtividade(botao.dataset.id);
    });
  });
}

//EDITAR ATIVIDADE
async function editarAtividade(id){
  try{
    //Faz uma busca pra encontrar a atividade selecionada
    const resultado = await getDocs(collection(db, "atividades"));
    resultado.forEach((documento) => {
      //Veriica se é a atividade correta
      if (documento.id === id){
        const atividade = documento.data();
        //Preenche o fomulário com os dados da atividade a ser editada
        atividadeInput.value = atividade.atividadeNome || "";
        tipoSelect.value = atividade.tipo || "";
        dataAtividadeInput.value = atividade.dataAtividade || "";
        horaAtividadeInput.value = atividade.horaAtividade || "";
        responsavelSelect.value = atividade.responsavelId || "";
        localInput.value = atividade.local || "";
        statusSelect.value = atividade.status || "Agendada";
        observacoesInput.value = atividade.observacoes || "";

        atividadeEditandoId = documento.id;
        botaoSalvar.innerHTML = '<i class="fa-solid fa-pen"></i> Atualizar atividade';
        //Leva o usuário até o formulário
        atividadeForm.scrollIntoView({behavior: "smooth"});

      }
    });
  }catch(error){
    console.error("Erro ao editar atividade:", error);
    alert("Não foi possível carregar os dados da atividade.");
  }
}

//EXCLUIR FUNCIONARIO
async function excluirAtividade(id){
  const confirmar = confirm("Tem certeza que deseja excluir esta atividade?");
  if (!confirmar) {
    //Cancela o excluir atividade
    return;
  }
  
  try{
    await deleteDoc(doc(db, "atividades", id));
    alert("Atividade excluída com sucesso!");
    await carregarAtividades();

  }catch(error){
    console.error("Erro ao excluir atividade:",error);
    alert("Não foi possível excluir a atividade.");
  }
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