const firebaseConfig = {
    apiKey: "AIzaSyANzrxQEML5PQYCiCUzqqz5OihvyqPiBsg",
    authDomain: "agendamentos-be5d2.firebaseapp.com",
    projectId: "agendamentos-be5d2",
    storageBucket: "agendamentos-be5d2.firebasestorage.app",
    messagingSenderId: "1049834206159",
    appId: "1:1049834206159:web:3d00e6b95c13bee9b058ba"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const AGENDAMENTOS_REF = 'agendamentos';

// --- Lógica de Autenticação ---

auth.onAuthStateChanged(user => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'login.html') {
        if (user) {
            window.location.href = 'admin.html'; // Redireciona se JÁ logado
        }
    } else if (currentPage === 'admin.html') {
        if (!user) {
            window.location.href = 'login.html'; // Redireciona se NÃO logado
        } else {
            // Se logado, carrega os dados
            loadAgendamentos();
        }
    }
});

// Lógica de Login (usado em login.html)
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginMessage = document.getElementById('loginMessage');

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Sucesso. onAuthStateChanged irá redirecionar.
            })
            .catch((error) => {
                loginMessage.textContent = `Erro de Login: ${error.message}`;
                loginMessage.style.color = 'red';
            });
    });
}

// Lógica de Logout (usado em admin.html)
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut().then(() => {
            // Sucesso. onAuthStateChanged irá redirecionar.
        }).catch((error) => {
            console.error("Erro ao fazer logout: ", error);
        });
    });
}

// --- Lógica CRUD do Administrador (Realtime Database) ---

// R (Read): Carregar e exibir os agendamentos
function loadAgendamentos() {
    const tbody = document.getElementById('agendamentosTable').querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="6">Carregando agendamentos...</td></tr>';

    // Listener em tempo real para atualizações (on('value', ...))
    database.ref(AGENDAMENTOS_REF).on('value', (snapshot) => {
        tbody.innerHTML = ''; // Limpa a tabela
        
        if (!snapshot.exists() || snapshot.val() === null) {
            tbody.innerHTML = '<tr><td colspan="6">Nenhum agendamento encontrado.</td></tr>';
            return;
        }

        const agendamentos = snapshot.val();
        
        // Converte o objeto de agendamentos em um array e ordena por dia
        const agendamentosArray = Object.keys(agendamentos).map(key => ({
            id: key, // O ID/Chave do Realtime Database
            ...agendamentos[key] // Os dados
        })).sort((a, b) => (a.dia || "").localeCompare(b.dia || "")); 

        agendamentosArray.forEach(data => {
            const row = tbody.insertRow();
            
            // Colunas de dados (usando 'id' como a chave do Realtime DB)
            row.insertCell().textContent = data.dia || 'N/A';
            row.insertCell().textContent = data.nome || 'N/A';
            row.insertCell().textContent = data.servico || 'N/A';
            row.insertCell().textContent = (data.valor !== null && data.valor !== undefined) ? `R$ ${parseFloat(data.valor).toFixed(2)}` : 'N/A';
            row.insertCell().textContent = data.telefone || 'N/A';

            // Coluna de Ações (Editar e Apagar)
            const actionsCell = row.insertCell();
            
            // Botão EDITAR
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.onclick = () => editAgendamento(data.id, data);
            actionsCell.appendChild(editBtn);

            // Botão APAGAR
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Apagar';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = () => deleteAgendamento(data.id);
            actionsCell.appendChild(deleteBtn);
        });
    }, (error) => {
        console.error("Erro ao carregar agendamentos: ", error);
        tbody.innerHTML = '<tr><td colspan="6">Erro ao carregar dados.</td></tr>';
    });
}

// U (Update): Editar um agendamento
function editAgendamento(id, data) {
    // Uso de prompt simplificado. Em produção, use um modal HTML.
    const novoDia = prompt(`Editar Dia (Atual: ${data.dia || 'N/A'}):`, data.dia || '');
    const novoNome = prompt(`Editar Nome (Atual: ${data.nome || 'N/A'}):`, data.nome || '');
    const novoServico = prompt(`Editar Serviço (Atual: ${data.servico || 'N/A'}):`, data.servico || '');
    const novoValorStr = prompt(`Editar Valor (Atual: ${data.valor || 'N/A'}):`, data.valor || '');
    const novoTelefone = prompt(`Editar Telefone (Atual: ${data.telefone || 'N/A'}):`, data.telefone || '');

    const updates = {};
    if (novoDia !== null) updates.dia = novoDia.trim() || null;
    if (novoNome !== null) updates.nome = novoNome.trim() || null;
    if (novoServico !== null) updates.servico = novoServico.trim() || null;
    // Lógica para garantir que o valor seja um número ou null
    if (novoValorStr !== null) {
        updates.valor = parseFloat(novoValorStr) || null;
        if (updates.valor === 0 && novoValorStr.trim() !== '0') updates.valor = null; // Trata '0' como N/A se for vazio
    }
    if (novoTelefone !== null) updates.telefone = novoTelefone.trim() || null;

    if (Object.keys(updates).length > 0) {
        database.ref(`${AGENDAMENTOS_REF}/${id}`).update(updates)
            .then(() => {
                alert('Agendamento atualizado com sucesso!');
            })
            .catch((error) => {
                console.error("Erro ao atualizar agendamento: ", error);
                alert('Erro ao atualizar. Verifique o console.');
            });
    }
}

// D (Delete): Apagar um agendamento
function deleteAgendamento(id) {
    if (confirm('Tem certeza que deseja apagar este agendamento?')) {
        database.ref(`${AGENDAMENTOS_REF}/${id}`).remove()
            .then(() => {
                // A tabela é atualizada automaticamente pelo listener 'onSnapshot'
                alert('Agendamento apagado com sucesso!');
            })
            .catch((error) => {
                console.error("Erro ao apagar agendamento: ", error);
                alert('Erro ao apagar. Verifique o console.');
            });
    }
}