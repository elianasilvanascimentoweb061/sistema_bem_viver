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
const cancelarBotao = document.getElementById("cancelarBotao");
const botaoSalvar = document.getElementById("botaoSalvar");
//Corpo da tabela
const funcionariosTb = document.getElementById("funcionariosTb");
//Formulário
const funcionarioForm = document.getElementById("funcionarioForm");
const tituloForm = document.getElementById("tituloForm");
const descricaoForm = document.getElementById("descricaoForm");
//Mensagem exibida quando não existem pacientes
const tabelaVazia = document.getElementById("tabelaVazia");

//Campos do formulário
const nomeInput = document.getElementById("nome");
const dataNascimentoInput = document.getElementById("dataNascimento");
const sexoSelect = document.getElementById("sexo");
const cpfInput = document.getElementById("cpf");
const cargoSelect = document.getElementById("cargo");
const telefoneInput = document.getElementById("telefone");
const emailInput = document.getElementById("email");
const dataAdmissaoInput = document.getElementById("dataAdmissao");
const enderecoInput = document.getElementById("endereco");
const observacoesInput = document.getElementById("observacoes");

//Controle de edição
//Quando for null =  cadastro, quando tiver um id = edição
let funcionarioEditandoId = null;

//Verifica autenticação - para que o usuário não consiga acessar a página sem fazer o login
onAuthStateChanged(auth, async (usuario) =>{
  if (!usuario) {
    window.location.href = "index.html";
    return;
  }
  //Mostra no console o usuário autenticado
  console.log("Usuário logado: ", usuario.email);
  userNome.textContent = usuario.email; //Mostra o email do no dashboard
  await carregarFuncionarios(); //Carrega os funcionarios do banco
});

//Cancelar cadastro
cancelarBotao.addEventListener("click", () => {
  //Limpa todos os campos
  funcionarioForm.reset();
  //Sai do modo edição
  funcionarioEditandoId = null;
  //Muda visualmente o titulo e a descrição do formulário
  tituloForm.textContent = "Novo funcionário";
  descricaoForm.textContent = "Informe os dados do funcionário"; 
  botaoSalvar.disabled = false;
  botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar funcionário';
});

//Salvar ou Atualizar paciente - Junta o cadastrar e o editar em uma única lógica
funcionarioForm.addEventListener("submit", async (event) =>{
  //Evita que o navegador recarregue a página
  event.preventDefault();

  try{
    botaoSalvar.disabled = true; 
    botaoSalvar.textContent = "Salvando...";

    //Modo edição
    if(funcionarioEditandoId){
      await updateDoc(doc(db, "funcionarios", funcionarioEditandoId),{
        //Atualiza o documento
        nome: nomeInput.value.trim(),
        dataNascimento: dataNascimentoInput.value,
        sexo: sexoSelect.value || "Não informado",
        cpf: cpfInput.value.trim(),
        cargo: cargoSelect.value,
        telefone: telefoneInput.value.trim(),
        email: emailInput.value.trim(),
        dataAdmissao: dataAdmissaoInput.value,
        endereco: enderecoInput.value.trim(),
        observacoes: observacoesInput.value.trim(),
      });
      alert("Funcionário atualizado com sucesso!");
    }else{
      //Novo cadastro
      await addDoc(collection(db, "funcionarios"),{
        nome: nomeInput.value.trim(),
        dataNascimento: dataNascimentoInput.value,
        sexo: sexoSelect.value || "Não informado",
        cpf: cpfInput.value.trim(),
        cargo: cargoSelect.value,
        telefone: telefoneInput.value.trim(),
        email: emailInput.value.trim(),
        dataAdmissao: dataAdmissaoInput.value,
        endereco: enderecoInput.value.trim(),
        observacoes: observacoesInput.value.trim(),
        //Registra quando o cadastro foi realizado
        dataCadastro: serverTimestamp()
      });
      alert("Funcionário cadastrado com sucesso!");
    }
    //Limpa o formulário
    funcionarioForm.reset();
    funcionarioEditandoId = null;
    //Muda visualmente o titulo e a descrição do formulário
    tituloForm.textContent = "Novo funcionário";
    descricaoForm.textContent = "Informe os dados do funcionário";
    botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar funcionário';
    botaoSalvar.disabled = false;

    //Atualiza a tabela
    await carregarFuncionarios();

  }catch (error){
    console.error("Erro ao salvar funcionário: ", error);
    alert("Não foi possível salvar o funcionário.");
    botaoSalvar.disabled = false;
    botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar funcionário';
  }
});//Fim salvar ou Atualizar funcionario

//Carregar pacientes
async function carregarFuncionarios(){
  try{
    //Proura os documentos existentes na lista de funcionários
    const resultado = await getDocs(collection(db,"funcionarios"));
    funcionariosTb.innerHTML = "";

    //Nenhum funcionario
    if (resultado.empty) {
      tabelaVazia.style.display = "block";
      return;
    }
    tabelaVazia.style.display = "none";

    //Preencher tabela
    resultado.forEach((documento) =>{
      //Pega os dados do documento
      const funcionario = documento.data();
      //Cria uma nova linha
      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td> ${funcionario.nome || "-"} </td>
        <td> ${funcionario.cargo || "-"} </td>
        <td> ${funcionario.telefone || "-"} </td>
        <td> ${funcionario.email || "-"} </td>
        <td> ${formatarData(funcionario.dataAdmissao)} </td>
        <td>
          <button
            class="table_action editar"
            data-id="${documento.id}"
            title="Editar funcionário"
            type="button"
          >
            <i class="fa-solid fa-pen"></i>
          </button>

          <button
            class="table_action excluir"
            data-id="${documento.id}"
            title="Excluir funcionário"
            type="button"
          >
            <i class="fa-solid fa-trash"></i>
          </button>

        </td>
      `;
      //Adiciona uma linha na tabela
      funcionariosTb.appendChild(linha);
    });

    adicionarEventosBotoes();

  }catch(error){
    console.error("Erro ao carregar funcionários:", error);
  }
}//Fim carregar funcionário

//Botões editar e excluir
function adicionarEventosBotoes(){
  const botoesEditar = document.querySelectorAll(".editar");
  const botoesExcluir = document.querySelectorAll(".excluir");

  //Editar
  botoesEditar.forEach((botao) => {
    botao.addEventListener("click",() => {
      editarFuncionario(botao.dataset.id);
    });
  });

  //Excluir
  botoesExcluir.forEach((botao) => {
    botao.addEventListener("click",() => {
      excluirFuncionario(botao.dataset.id);
    });
  });
}

//EDITAR FUNCIONÁRIO
async function editarFuncionario(id){
  try{
    //Faz uma busca pra encontrar o funcionário selecionado
    const resultado = await getDocs(collection(db, "funcionarios"));
    resultado.forEach((documento) => {
      //Veriica se é o pacient correto
      if (documento.id === id){
        const funcionario = documento.data();
        //Preenche o fomulário com os dados do funcionario a ser editado
        nomeInput.value = funcionario.nome || "";
        dataNascimentoInput.value = funcionario.dataNascimento || "";
        sexoSelect.value = funcionario.sexo || "";
        cpfInput.value = funcionario.cpf || "";
        cargoSelect.value = funcionario.cargo || "";
        telefoneInput.value = funcionario.telefone || "";
        emailInput.value = funcionario.email || "";
        dataAdmissaoInput.value = funcionario.dataAdmissao || "";
        enderecoInput.value = funcionario.endereco || "";
        observacoesInput.value = funcionario.observacoes || "";

        funcionarioEditandoId = documento.id;
        //Muda visualmente o titulo e a descrição do formulário
        tituloForm.textContent = "Editar funcionário";
        descricaoForm.textContent = "Altere os dados do funcionário"; 
        botaoSalvar.innerHTML = '<i class="fa-solid fa-pen"></i> Atualizar funcionário';
        //Leva o usuário até o formulário
        funcionarioForm.scrollIntoView({behavior: "smooth"});

      }
    });
  }catch(error){
    console.error("Erro ao editar funcionário:", error);
    alert("Não foi possível carregar os dados do funcionário.");
  }
}

//EXCLUIR FUNCIONARIO
async function excluirFuncionario(id){
  const confirmar = confirm("Tem certeza que deseja excluir este funcionário?");
  if (!confirmar) {
    //Cancela o excluir funcionário
    return;
  }
  
  try{
    await deleteDoc(doc(db, "funcionarios", id));
    alert("Funcionário excluído com sucesso!");
    await carregarFuncionarios();

  }catch(error){
    console.error("Erro ao excluir funcionário:",error);
    alert("Não foi possível excluir o funcionário.");
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