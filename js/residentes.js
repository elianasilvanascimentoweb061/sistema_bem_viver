//Importa o Authentication e o Firestore que já foram configurados no firebase.js
import {auth, db} from "./firebase.js";
import {
  onAuthStateChanged, //verifica se tem algum usuário logado
  signOut //pra sair
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
//Funções pra trabalhar com documentos do Firestore
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
const cancelarResidenteBotao = document.getElementById("cancelarResidenteBotao");
const botaoSalvar = document.getElementById("botaoSalvar");
//Corpo da tabela
const residentesTb = document.getElementById("residentesTb");
//Formulário
const residenteForm = document.getElementById("residenteForm");
const tituloForm = document.getElementById("tituloForm");
const descricaoForm = document.getElementById("descricaoForm");
//Mensagem exibida quando não existem residentes
const tabelaVazia = document.getElementById("tabelaVazia");

//Campos do formulário
const nomeInput = document.getElementById("nome");
const dataNascimentoInput = document.getElementById("dataNascimento");
const sexoSelect = document.getElementById("sexo");
const cpfInput = document.getElementById("cpf");
const telefoneInput = document.getElementById("telefone");
const responsavelInput = document.getElementById("responsavel");
const enderecoInput = document.getElementById("endereco");
const observacoesInput = document.getElementById("observacoes");

//Controle de edição
//Quando for null =  cadastro, quando tiver um id = edição
let residenteEditandoId = null;

//Verifica autenticação - para que o usuário não consiga acessar a página sem fazer o login
onAuthStateChanged(auth, async (usuario) =>{
  if (!usuario) {
    window.location.href = "index.html";
    return;
  }
  //Mostra no console o usuário autenticado
  console.log("Usuário logado: ", usuario.email);
  userNome.textContent = usuario.email; //Mostra o email do no dashboard
  await carregarResidentes(); //Carrega os residentes do banco
});

//Cancelar cadastro
cancelarResidenteBotao.addEventListener("click", () => {
  //Limpa todos os campos
  residenteForm.reset();
  //Sai do modo edição
  residenteEditandoId = null;
  //Muda visualmente o titulo e a descrição do formulário
  tituloForm.textContent = "Novo residente";
  descricaoForm.textContent = "Informe os dados do residente"; 
  botaoSalvar.disabled = false;
  botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar residente';
});

//Salvar ou Atualizar residente - Junta o cadastrar e o editar em uma única lógica
residenteForm.addEventListener("submit", async (event) =>{
  //Evita que o navegador recarregue a página
  event.preventDefault();

  try{
    botaoSalvar.disabled = true; 
    botaoSalvar.textContent = "Salvando...";

    //Modo edição
    if(residenteEditandoId){
      await updateDoc(doc(db, "residentes", residenteEditandoId),{
        //Atualiza o documento
        nome: nomeInput.value.trim(),
        dataNascimento: dataNascimentoInput.value.trim(),
        cpf: cpfInput.value.trim(),
        sexo: sexoSelect.value || "Não informado",
        telefone: telefoneInput.value.trim(),
        responsavel: responsavelInput.value.trim(),
        endereco: enderecoInput.value.trim(),
        observacoes: observacoesInput.value.trim(),
      });
      alert("Residente atualizado com sucesso!");
    }else{
      //Novo cadastro
      await addDoc(collection(db, "residentes"),{
        nome: nomeInput.value.trim(),
        dataNascimento: dataNascimentoInput.value,
        cpf: cpfInput.value.trim(),
        sexo: sexoSelect.value || "Não informado",
        telefone: telefoneInput.value.trim(),
        responsavel: responsavelInput.value.trim(),
        endereco: enderecoInput.value.trim(),
        observacoes: observacoesInput.value.trim(),
        //Registra quando o cadastro foi realizado
        dataCadastro: serverTimestamp()
      });
      alert("Residente cadastrado com sucesso!");
    }
    //Limpa o formulário
    residenteForm.reset();
    residenteEditandoId = null;
    //Muda visualmente o titulo e a descrição do formulário
    tituloForm.textContent = "Novo residente";
    descricaoForm.textContent = "Informe os dados do residente"; 
    botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar residente';
    botaoSalvar.disabled = false;

    //Atualiza a tabela
    await carregarResidentes();

  }catch (error){
    console.error("Erro ao salvar residente: ", error);
    alert("Não foi possível salvar o residente.");
    botaoSalvar.disabled = false;
    botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar residente';
  }
});//Fim salvar ou Atualizar residente

//Carregar residentes
async function carregarResidentes(){
  try{
    //Proura os documentos existentes na lista de residentes
    const resultado = await getDocs(collection(db,"residentes"));
    residentesTb.innerHTML = "";

    //Nenhum residente
    if (resultado.empty) {
      tabelaVazia.style.display = "block";
      return;
    }
    tabelaVazia.style.display = "none";

    //Cria um array com os residentes
    const residentes = [];

    resultado.forEach((documento) => {
      const residente = documento.data();
      residentes.push({
        id: documento.id, ...residente
      });
    });

    //Ordena os residentes em ordem alfabética pelo nome
    residentes.sort((a, b) => {
      return (a.nome || "").localeCompare(
        b.nome || "",
        "pt-BR",
        { sensitivity: "base" }
      );
    });

    //Prenche a tabela com os dados já ordenados
    residentes.forEach((residente) => {
      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td>${residente.nome || "-"}</td>
        <td>${formatarData(residente.dataNascimento)}</td>
        <td>${residente.responsavel || "-"}</td>
        <td>${residente.telefone || "-"}</td>
        <td>
          <button
            class="table_action editar"
            data-id="${residente.id}"
            title="Editar residente"
            type="button"
          >
            <i class="fa-solid fa-pen"></i>
          </button>

          <button
            class="table_action excluir"
            data-id="${residente.id}"
            title="Excluir residente"
            type="button"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      //Adiciona uma linha na tabela
      residentesTb.appendChild(linha);
    });

    adicionarEventosBotoes();

  }catch(error){
    console.error("Erro ao carregar residentes:", error);
  }
}//Fim carregar residente

//Botões editar e excluir
function adicionarEventosBotoes(){
  const botoesEditar = document.querySelectorAll(".editar");
  const botoesExcluir = document.querySelectorAll(".excluir");

  //Editar
  botoesEditar.forEach((botao) => {
    botao.addEventListener("click",() => {
      editarResidente(botao.dataset.id);
    });
  });

  //Excluir
  botoesExcluir.forEach((botao) => {
    botao.addEventListener("click",() => {
      excluirResidente(botao.dataset.id);
    });
  });
}

//EDITAR RESIDENTE
async function editarResidente(id){
  try{
    //Faz uma busca pra encontrar o residente selecionado
    const resultado = await getDocs(collection(db, "residentes"));
    resultado.forEach((documento) => {
      //Veriica se é o pacient correto
      if (documento.id === id){
        const residente = documento.data();
        //Preenche o fomulário com os dados do residente a ser editado
        nomeInput.value = residente.nome || "";
        dataNascimentoInput.value = residente.dataNascimento || "";
        sexoSelect.value = residente.sexo || "";
        cpfInput.value = residente.cpf || "";
        telefoneInput.value = residente.telefone || "";
        responsavelInput.value = residente.responsavel || "";
        enderecoInput.value = residente.endereco || "";
        observacoesInput.value = residente.observacoes || "";

        residenteEditandoId = documento.id;
        //Muda visualmente o titulo e a descrição do formulário
        tituloForm.textContent = "Editar residente";
        descricaoForm.textContent = "Altere os dados do residente"; 
        botaoSalvar.innerHTML = '<i class="fa-solid fa-pen"></i> Atualizar residente';
        //Leva o usuário até o formulário
        residenteForm.scrollIntoView({behavior: "smooth"});

      }
    });
  }catch(error){
    console.error("Erro ao editar residente:", error);
    alert("Não foi possível carregar os dados do residente.");
  }
}

//EXCLUIR RESIDENTE
async function excluirResidente(id){
  const confirmar = confirm("Tem certeza que deseja excluir este residente?");
  if (!confirmar) {
    //Cancela o excluir residente
    return;
  }
  
  try{
    await deleteDoc(doc(db, "residentes", id));
    alert("Residente excluído com sucesso!");
    await carregarResidentes();

  }catch(error){
    console.error("Erro ao excluir residente:",error);
    alert("Não foi possível excluir o residente.");
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