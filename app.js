const firebaseConfig = {
    apiKey: "AIzaSyANzrxQEML5PQYCiCUzqqz5OihvyqPiBsg",
    authDomain: "agendamentos-be5d2.firebaseapp.com",
    projectId: "agendamentos-be5d2",
    storageBucket: "agendamentos-be5d2.firebasestorage.app",
    messagingSenderId: "1049834206159",
    appId: "1:1049834206159:web:3d00e6b95c13bee9b058ba"
};

// Inicializa o Firebase e o Realtime Database
firebase.initializeApp(firebaseConfig);
const database = firebase.database(); 
const AGENDAMENTOS_REF = 'agendamentos';

document.getElementById('agendamentoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const mensagem = document.getElementById('mensagem');
    mensagem.textContent = 'Aguarde...';
    mensagem.style.color = 'blue';

    // Coleta os dados do formulário
    const agendamentoData = {
        dia: document.getElementById('dia').value || null, // data
        nome: document.getElementById('nome').value || null,
        servico: document.getElementById('servico').value || null,
        // Garante que o valor seja salvo como null se o campo estiver vazio
        valor: document.getElementById('valor').value ? parseFloat(document.getElementById('valor').value) : null,
        telefone: document.getElementById('telefone').value || null,
        dataCriacao: firebase.database.ServerValue.TIMESTAMP // Para saber quando foi criado
    };

    // Validação mínima (opcional, mas recomendado)
    const values = Object.values(agendamentoData).filter(v => v !== null && typeof v !== 'number' && v !== agendamentoData.dataCriacao);
    if (values.length === 0 && agendamentoData.dia === null && agendamentoData.valor === null) {
        mensagem.textContent = 'Preencha pelo menos um campo para agendar.';
        mensagem.style.color = 'red';
        return;
    }
    
    // Salva os dados no Realtime Database usando push()
    database.ref(AGENDAMENTOS_REF).push(agendamentoData)
        .then(() => {
            mensagem.textContent = 'Agendamento registrado com sucesso!';
            mensagem.style.color = 'green';
            document.getElementById('agendamentoForm').reset(); // Limpa o formulário
        })
        .catch((error) => {
            console.error("Erro ao registrar agendamento: ", error);
            mensagem.textContent = `Erro ao agendar: ${error.message}`;
            mensagem.style.color = 'red';
        });
});