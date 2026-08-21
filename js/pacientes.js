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
const cancelarPacienteBotao = document.getElementById("cancelarPacienteBotao");
const botaoSalvar = document.getElementById("botaoSalvar");
//Corpo da tabela
const pacientesTb = document.getElementById("pacientesTb");
//Formulário
const pacienteForm = document.getElementById("pacienteForm");
//Mensagem exibida quando não existem pacientes
const tabelaVazia = document.getElementById("tabelaVazia");

//Campos do formulário
const nomeInput = document.getElementById("nome");
const dataNascimentoInput = document.getElementById("dataNascimento");
const cpfInput = document.getElementById("cpf");
const telefoneInput = document.getElementById("telefone");
const responsavelInput = document.getElementById("responsavel");
const enderecoInput = document.getElementById("endereco");
const observacoesInput = document.getElementById("observacoes");

//Controle de edição
//Quando for null =  cadastro, quando tiver um id = edição
let pacienteEditandoId = null;

//Verifica autenticação - para que o usuário não consiga acessar a página sem fazer o login
onAuthStateChanged(auth, async (usuario) =>{
  if (!usuario) {
    window.location.href = "index.html";
    return;
  }
  //Mostra no console o usuário autenticado
  console.log("Usuário logado: ", usuario.email);
  userNome.textContent = usuario.email; //Mostra o email do no dashboard
  await carregarPacientes(); //Carrega os pacientes do banco
});

//Cancelar cadastro
cancelarPacienteBotao.addEventListener("click", () => {
  //Limpa todos os campos
  pacienteForm.reset();
  //Sai do modo edição
  pacienteEditandoId = null;
  botaoSalvar.disabled = false;
  botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar paciente';
});

//Salvar ou Atualizar paciente - Junta o cadastrar e o editar em uma única lógica
pacienteForm.addEventListener("submit", async (event) =>{
  //Evita que o navegador recarregue a página
  event.preventDefault();

  try{
    botaoSalvar.disabled = true; 
    botaoSalvar.textContent = "Salvando...";

    //Modo edição
    if(pacienteEditandoId){
      await updateDoc(doc(db, "pacientes", pacienteEditandoId),{
        //Atualiza o documento
        nome: nomeInput.value.trim(),
        dataNascimento: dataNascimentoInput.value.trim(),
        cpf: cpfInput.value.trim(),
        telefone: telefoneInput.value.trim(),
        responsavel: responsavelInput.value.trim(),
        endereco: enderecoInput.value.trim(),
        observacoes: observacoesInput.value.trim(),
      });
      alert("Paciente atualizado com sucesso!");
    }else{
      //Novo cadastro
      await addDoc(collection(db, "pacientes"),{
        nome: nomeInput.value.trim(),
        dataNascimento: dataNascimentoInput.value,
        cpf: cpfInput.value.trim(),
        telefone: telefoneInput.value.trim(),
        responsavel: responsavelInput.value.trim(),
        endereco: enderecoInput.value.trim(),
        observacoes: observacoesInput.value.trim(),
        //Registra quando o cadastro foi realizado
        dataCadastro: serverTimestamp()
      });
      alert("Paciente cadastrado com sucesso!");
    }
    //Limpa o formulário
    pacienteForm.reset();
    pacienteEditandoId = null;
    botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar paciente';
    botaoSalvar.disabled = false;

    //Atualiza a tabela
    await carregarPacientes();

  }catch (error){
    console.error("Erro ao salvar paciente: ", error);
    alert("Não foi possível salvar o paciente.");
    botaoSalvar.disabled = false;
    botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar paciente';
  }
});//Fim salvar ou Atualizar paciente

//Carregar pacientes
async function carregarPacientes(){
  try{
    //Proura os documentos existentes na lista de pacientes
    const resultado = await getDocs(collection(db,"pacientes"));
    pacientesTb.innerHTML = "";

    //Nenhum paciente
    if (resultado.empty) {
      tabelaVazia.style.display = "block";
      return;
    }
    tabelaVazia.style.display = "none";

    //Preencher tabela
    resultado.forEach((documento) =>{
      //Pega os dados do documento
      const paciente = documento.data();
      //Cria uma nova linha
      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td> ${paciente.nome || "-"} </td>
        <td> ${formatarData(paciente.dataNascimento)} </td>
        <td> ${paciente.responsavel || "-"} </td>
        <td> ${paciente.telefone || "-"} </td>
        <td>
          <button
            class="table_action editar"
            data-id="${documento.id}"
            title="Editar paciente"
            type="button"
          >
            <i class="fa-solid fa-pen"></i>
          </button>

          <button
            class="table_action excluir"
            data-id="${documento.id}"
            title="Excluir paciente"
            type="button"
          >
            <i class="fa-solid fa-trash"></i>
          </button>

        </td>
      `;
      //Adiciona uma linha na tabela
      pacientesTb.appendChild(linha);
    });

    adicionarEventosBotoes();

  }catch(error){
    console.error("Erro ao carregar pacientes:", error);
  }
}//Fim carregar paciente

//Botões editar e excluir
function adicionarEventosBotoes(){
  const botoesEditar = document.querySelectorAll(".editar");
  const botoesExcluir = document.querySelectorAll(".excluir");

  //Editar
  botoesEditar.forEach((botao) => {
    botao.addEventListener("click",() => {
      editarPaciente(botao.dataset.id);
    });
  });

  //Excluir
  botoesExcluir.forEach((botao) => {
    botao.addEventListener("click",() => {
      excluirPaciente(botao.dataset.id);
    });
  });
}

//EDITAR PACIENTE
async function editarPaciente(id){
  try{
    //Faz uma busca pra encontrar o paciente selecionado
    const resultado = await getDocs(collection(db, "pacientes"));
    resultado.forEach((documento) => {
      //Veriica se é o pacient correto
      if (documento.id === id){
        const paciente = documento.data();
        //Preenche o fomulário com os dados do paciente a ser editado
        nomeInput.value = paciente.nome || "";
        dataNascimentoInput.value = paciente.dataNascimento || "";
        cpfInput.value = paciente.cpf || "";
        telefoneInput.value = paciente.telefone || "";
        responsavelInput.value = paciente.responsavel || "";
        enderecoInput.value = paciente.endereco || "";
        observacoesInput.value = paciente.observacoes || "";

        pacienteEditandoId = documento.id;
        botaoSalvar.innerHTML = '<i class="fa-solid fa-pen"></i> Atualizar paciente';
        //Leva o usuário até o formulário
        pacienteForm.scrollIntoView({behavior: "smooth"});

      }
    });
  }catch(error){
    console.error("Erro ao editar paciente:", error);
    alert("Não foi possível carregar os dados do paciente.");
  }
}

//EXCLUIR PACIENTE
async function excluirPaciente(id){
  const confirmar = confirm("Tem certeza que deseja excluir este paciente?");
  if (!confirmar) {
    //Cancela o excluir paciente
    return;
  }
  
  try{
    await deleteDoc(doc(db, "pacientes", id));
    alert("Paciente excluído com sucesso!");
    await carregarPacientes();

  }catch(error){
    console.error("Erro ao excluir paciente:",error);
    alert("Não foi possível excluir o paciente.");
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