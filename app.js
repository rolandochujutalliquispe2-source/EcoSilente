// Cargar datos guardados previamente o usar los valores por defecto si es la primera vez
let alertas = JSON.parse(localStorage.getItem('ecosilente_alertas')) || [
    {
        id: 1,
        profesor: "Prof. María Gómez",
        tipo: "Hostigamiento",
        grado: "4to Grado de Secundaria",
        descripcion: "Insultos constantes en la hora de recreo cerca de los baños.",
        hora: "Hace 15 min",
        prioridad: "NUEVA ALERTA"
    }
];

let resolvedCasesLog = JSON.parse(localStorage.getItem('ecosilente_resolved')) || [];

let registeredTutors = JSON.parse(localStorage.getItem('ecosilente_tutors')) || [
    { id: 1, name: "Administrador General", user: "admin@ecosilente.edu.pe", pass: "admin123", approved: true }
];

let pendingTutors = JSON.parse(localStorage.getItem('ecosilente_pending')) || [
    { id: 101, name: "Prof. Carlos Pérez", user: "cperez@colegio.edu.pe", pass: "profe123", approved: false }
];

let ecoDaysCount = parseInt(localStorage.getItem('ecosilente_ecodays')) || 0;
let dailyChallengeCompleted = (localStorage.getItem('ecosilente_challengedone') === 'true');
let solvedCasesCount = parseInt(localStorage.getItem('ecosilente_solvedcount')) || 0;

let currentTutorSession = null;
let isUserLoggedInAsTutor = false;

// Banco de preguntas de convivencia para el Reto Diario
const dailyDilemma = {
    question: "Ves que un grupo deja aislado a un compañero nuevo en el almuerzo y se ríen disimuladamente. ¿Qué acción demuestra verdadera empatía?",
    options: [
        { icon: "🚶‍♂️", text: "Ignorarlo por completo para no meterme en problemas.", points: 0, feedback: "La indiferencia deja que el problema crezca.", success: false },
        { icon: "🤝", text: "Acercarme a invitarlo a nuestra mesa o reportarlo de forma segura en EcoSilente.", points: 1, feedback: "¡Excelente! Fomentas un ambiente seguro, cálido y de respeto.", success: true }
    ]
};

// Función auxiliar para guardar cambios permanentemente y sincronizar
function saveDataToStorage() {
    localStorage.setItem('ecosilente_alertas', JSON.stringify(alertas));
    localStorage.setItem('ecosilente_resolved', JSON.stringify(resolvedCasesLog));
    localStorage.setItem('ecosilente_tutors', JSON.stringify(registeredTutors));
    localStorage.setItem('ecosilente_pending', JSON.stringify(pendingTutors));
    localStorage.setItem('ecosilente_ecodays', ecoDaysCount);
    localStorage.setItem('ecosilente_challengedone', dailyChallengeCompleted);
    localStorage.setItem('ecosilente_solvedcount', solvedCasesCount);
}

// --- SINCRONIZACIÓN AUTOMÁTICA ENTRE PESTAÑAS Y DISPOSITIVOS ---
window.addEventListener('storage', (event) => {
    if (event.key === 'ecosilente_alertas') {
        alertas = JSON.parse(event.newValue) || [];
        renderAlerts();
    }
    if (event.key === 'ecosilente_resolved') {
        resolvedCasesLog = JSON.parse(event.newValue) || [];
    }
    if (event.key === 'ecosilente_tutors') {
        registeredTutors = JSON.parse(event.newValue) || [];
    }
    if (event.key === 'ecosilente_pending') {
        pendingTutors = JSON.parse(event.newValue) || [];
    }
    if (event.key === 'ecosilente_ecodays') {
        ecoDaysCount = parseInt(event.newValue) || 0;
    }
    if (event.key === 'ecosilente_solvedcount') {
        solvedCasesCount = parseInt(event.newValue) || 0;
    }
    if (event.key === 'ecosilente_student_reports') {
        renderStudentInbox();
    }
    
    if (typeof renderSupportDashboard === 'function' && document.getElementById('support-dashboard-box') && !document.getElementById('support-dashboard-box').classList.contains('hidden')) {
        renderSupportDashboard();
    }
});

// Transición inmediata sin pantalla en blanco al terminar los 4 segundos
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splashIntro = document.getElementById('view-splash-intro');
        const welcomeView = document.getElementById('view-welcome');
        
        if (welcomeView) {
            welcomeView.classList.remove('hidden-app');
        }
        if (splashIntro) {
            splashIntro.style.display = 'none';
        }
    }, 3800);
});

// Entrar como Estudiante
function enterApp() {
    isUserLoggedInAsTutor = false;
    const welcomeView = document.getElementById('view-welcome');
    const mainApp = document.getElementById('main-app-content');
    
    if(welcomeView) welcomeView.classList.add('hidden-app');
    if(mainApp) mainApp.classList.remove('hidden-app');
    
    document.querySelectorAll('.student-nav-item').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.tutor-nav-item').forEach(el => el.classList.add('hidden'));
    const btnTutorHeader = document.getElementById('btn-tutor');
    if(btnTutorHeader) btnTutorHeader.classList.add('hidden');
    
    switchView('student');
    renderGame();
    renderStudentInbox();
}

function goBackToWelcome() {
    currentTutorSession = null;
    isUserLoggedInAsTutor = false;
    
    const mainApp = document.getElementById('main-app-content');
    const authView = document.getElementById('view-auth-tutor');
    const supportView = document.getElementById('view-support-admin');
    const welcomeView = document.getElementById('view-welcome');

    if(mainApp) mainApp.classList.add('hidden-app');
    if(authView) authView.classList.add('hidden-app');
    if(supportView) supportView.classList.add('hidden-app');
    if(welcomeView) welcomeView.classList.remove('hidden-app');
}

function logoutToWelcome() { goBackToWelcome(); }

function openTutorAuth() {
    const welcomeView = document.getElementById('view-welcome');
    const authView = document.getElementById('view-auth-tutor');
    const mainApp = document.getElementById('main-app-content');
    const supportView = document.getElementById('view-support-admin');

    if(welcomeView) welcomeView.classList.add('hidden-app');
    if(mainApp) mainApp.classList.add('hidden-app');
    if(supportView) supportView.classList.add('hidden-app');
    if(authView) authView.classList.remove('hidden-app');
    
    switchAuthTab('login');
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('form-login-tutor');
    const registerForm = document.getElementById('form-register-tutor');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    
    document.getElementById('login-error-msg').style.display = 'none';
    document.getElementById('register-success-msg').style.display = 'none';

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.style.background = "var(--accent-yellow)";
        tabLogin.style.color = "var(--primary-dark)";
        tabRegister.style.background = "rgba(255,255,255,0.15)";
        tabRegister.style.color = "white";
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabRegister.style.background = "var(--accent-yellow)";
        tabRegister.style.color = "var(--primary-dark)";
        tabLogin.style.background = "rgba(255,255,255,0.15)";
        tabLogin.style.color = "white";
    }
}

function handleTutorRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;

    const exists = registeredTutors.find(t => t.user === user) || pendingTutors.find(t => t.user === user);
    if (exists) { alert("Este correo ya está registrado."); return; }

    pendingTutors.push({ id: Date.now(), name, user, pass, approved: false });
    saveDataToStorage();
    document.getElementById('register-success-msg').style.display = 'block';
    document.getElementById('form-register-tutor').reset();
}

function handleTutorLogin(event) {
    event.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error-msg');

    const found = registeredTutors.find(t => t.user === user && t.pass === pass);
    if (found) {
        if (!found.approved) {
            errorMsg.innerText = "⚠️ Cuenta pendiente de aprobación por soporte.";
            errorMsg.style.display = 'block';
            return;
        }
        currentTutorSession = found;
        isUserLoggedInAsTutor = true;
        document.getElementById('view-auth-tutor').classList.add('hidden-app');
        document.getElementById('main-app-content').classList.remove('hidden-app');
        
        document.querySelectorAll('.student-nav-item').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.tutor-nav-item').forEach(el => el.classList.remove('hidden'));
        
        const btnTutorHeader = document.getElementById('btn-tutor');
        if(btnTutorHeader) {
            btnTutorHeader.classList.remove('hidden');
            btnTutorHeader.classList.add('active');
        }

        switchView('tutor');
    } else {
        errorMsg.innerText = "❌ Credenciales incorrectas.";
        errorMsg.style.display = 'block';
    }
}

function openSupportLogin() {
    document.getElementById('view-welcome').classList.add('hidden-app');
    document.getElementById('view-auth-tutor').classList.add('hidden-app');
    document.getElementById('view-support-admin').classList.remove('hidden-app');
    document.getElementById('support-login-box').classList.remove('hidden');
    document.getElementById('support-dashboard-box').classList.add('hidden');
    document.getElementById('support-pass-input').value = '';
    document.getElementById('support-error-msg').style.display = 'none';
}

function verifySupportLogin() {
    const pass = document.getElementById('support-pass-input').value;
    if (pass === "ecosilente2026") {
        document.getElementById('support-login-box').classList.add('hidden');
        document.getElementById('support-dashboard-box').classList.remove('hidden');
        renderSupportDashboard();
    } else {
        document.getElementById('support-error-msg').style.display = 'block';
    }
}

function switchView(view) {
    const studentView = document.getElementById('view-student');
    const inboxView = document.getElementById('view-inbox');
    const tutorView = document.getElementById('view-tutor');
    const gameView = document.getElementById('view-game');
    const shopView = document.getElementById('view-shop');
    const helpView = document.getElementById('view-help');
    const authView = document.getElementById('view-auth-tutor');
    const supportView = document.getElementById('view-support-admin');
    
    const btnStudent = document.getElementById('btn-student');
    const btnInbox = document.getElementById('btn-inbox');
    const btnTutor = document.getElementById('btn-tutor');
    
    const navReport = document.getElementById('nav-btn-report');
    const navInbox = document.getElementById('nav-btn-inbox');
    const navTutor = document.getElementById('nav-btn-tutor');
    const navGame = document.getElementById('nav-btn-game');
    const navShop = document.getElementById('nav-btn-shop');
    const navHelp = document.getElementById('nav-btn-help');

    studentView.classList.add('hidden');
    inboxView.classList.add('hidden');
    tutorView.classList.add('hidden');
    gameView.classList.add('hidden');
    shopView.classList.add('hidden');
    helpView.classList.add('hidden');
    if(authView) authView.classList.add('hidden-app');
    if(supportView) supportView.classList.add('hidden-app');

    [navReport, navInbox, navTutor, navGame, navShop, navHelp].forEach(btn => btn.classList.remove('active-tab'));
    if(btnStudent) btnStudent.classList.remove('active');
    if(btnInbox) btnInbox.classList.remove('active');

    if (view === 'student') {
        studentView.classList.remove('hidden');
        if(btnStudent) btnStudent.classList.add('active');
        if(navReport) navReport.classList.add('active-tab');
    } else if (view === 'inbox') {
        inboxView.classList.remove('hidden');
        if(btnInbox) btnInbox.classList.add('active');
        if(navInbox) navInbox.classList.add('active-tab');
        renderStudentInbox();
    } else if (view === 'tutor') {
        tutorView.classList.remove('hidden');
        if(btnTutor) btnTutor.classList.add('active');
        if(navTutor) navTutor.classList.add('active-tab');
        renderAlerts();
    } else if (view === 'game') {
        gameView.classList.remove('hidden');
        if(navGame) navGame.classList.add('active-tab');
        renderGame();
    } else if (view === 'shop') {
        shopView.classList.remove('hidden');
        if(navShop) navShop.classList.add('active-tab');
        updateShopUI(); 
    } else if (view === 'help') {
        helpView.classList.remove('hidden');
        if(navHelp) navHelp.classList.add('active-tab');
    }
}

function handleReportSubmit(event) {
    event.preventDefault();
    const profesor = document.getElementById('profesor-destino').value;
    const tipo = document.getElementById('tipo-situacion').value;
    const grado = document.getElementById('grado-seccion').value;
    const descripcion = document.getElementById('descripcion').value;

    alertas.unshift({ id: Date.now(), profesor, tipo, grado, descripcion, hora: "Hace un momento", prioridad: "NUEVA ALERTA" });
    saveDataToStorage();
    document.getElementById('report-form').reset();
    
    const successBanner = document.getElementById('success-banner');
    successBanner.classList.remove('hidden');
    setTimeout(() => { successBanner.classList.add('hidden'); }, 4000);
    renderAlerts();
}

function renderAlerts() {
    // Sincronizar alertas recientes desde storage si otro dispositivo las envió
    const storedAlerts = JSON.parse(localStorage.getItem('ecosilente_alertas'));
    if (storedAlerts) alertas = storedAlerts;

    const container = document.getElementById('alerts-container');
    const counter = document.getElementById('alert-counter');
    const statCounter = document.getElementById('stat-counter');
    
    counter.innerText = alertas.length;
    statCounter.innerText = solvedCasesCount;

    if (alertas.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #A0AEC0; font-size: 11px; font-weight: 700;"><p>No hay alertas pendientes.</p></div>`;
        return;
    }

    container.innerHTML = '';
    alertas.forEach(alerta => {
        const card = document.createElement('div');
        card.className = "alert-card";
        card.innerHTML = `
            <div class="alert-top"><span class="priority-tag">${alerta.prioridad}</span><span class="time-ago">${alerta.hora}</span></div>
            <div class="alert-body">
                <div style="font-size: 9px; font-weight: 800; color: var(--accent-orange); margin-bottom: 2px;">👤 Destinatario: ${alerta.profesor}</div>
                <h4>${alerta.tipo}</h4>
                <p style="font-size: 9px; font-weight: 700; color: #4A5568;">📍 ${alerta.grado}</p>
            </div>
            <div class="alert-desc">"${alerta.descripcion}"</div>
            
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
                <label style="font-size: 9px; font-weight: 900; color: var(--primary-dark);">💬 Mensaje de respuesta para el estudiante:</label>
                <input type="text" id="resp-input-${alerta.id}" value="Hemos revisado tu caso, cuentas con todo nuestro apoyo." style="font-size: 9px; padding: 8px; border: 1.5px solid #CBD5E0; border-radius: 8px; background: #F8FAFC; outline: none; font-weight: 600;">
                <button onclick="atenderAlerta(${alerta.id})" class="btn-atender">Marcar como Atendido y Enviar Mensaje ✓</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function atenderAlerta(id) {
    const atendida = alertas.find(a => a.id === id);
    if (!atendida) return;

    const inputResp = document.getElementById(`resp-input-${id}`);
    const mensajeTutor = inputResp ? inputResp.value : "Caso revisado y atendido por el comité.";

    const casoResuelto = {
        ...atendida,
        atendidoPor: currentTutorSession ? currentTutorSession.name : "Tutor Autorizado",
        mensajeRespuesta: mensajeTutor || "Caso revisado y atendido por el comité.",
        fechaAtencion: "Hace un momento"
    };

    resolvedCasesLog.unshift(casoResuelto);
    alertas = alertas.filter(a => a.id !== id);
    solvedCasesCount++;

    let studentReports = JSON.parse(localStorage.getItem('ecosilente_student_reports')) || [];
    studentReports.unshift(casoResuelto);
    localStorage.setItem('ecosilente_student_reports', JSON.stringify(studentReports));

    saveDataToStorage();
    renderAlerts();
    renderStudentInbox();
}

function renderStudentInbox() {
    const container = document.getElementById('student-inbox-container');
    const studentReports = JSON.parse(localStorage.getItem('ecosilente_student_reports')) || [];

    if (!container) return;

    if (studentReports.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #A0AEC0; font-size: 10px; font-weight: 700; background: white; border-radius: 14px; border: 1px solid #E2E8F0;">
                <p>📭 No hay mensajes ni respuestas en tu bandeja de entrada todavía.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    studentReports.forEach(report => {
        const item = document.createElement('div');
        item.className = "student-status-card";
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-weight: 900; margin-bottom: 2px;">
                <span>📌 ${report.tipo} (${report.grado})</span>
                <span style="color: #10B981;">✓ Atendido</span>
            </div>
            <div style="color: #718096; margin-bottom: 4px;">Dirigido a: <strong>${report.profesor}</strong></div>
            <div>Atendido por: <strong>${report.atendidoPor}</strong></div>
            <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; padding: 8px; border-radius: 8px; margin-top: 6px; color: #78350F; font-weight: 700;">
                💬 <strong>Mensaje del tutor:</strong> "${report.mensajeRespuesta}"
            </div>
        `;
        container.appendChild(item);
    });
}

function renderSupportDashboard() {
    const containerPending = document.getElementById('support-pending-container');
    const containerResolved = document.getElementById('support-resolved-cases-container');
    
    document.getElementById('support-stat-cases').innerText = solvedCasesCount;
    document.getElementById('support-stat-pending').innerText = pendingTutors.length;

    if (pendingTutors.length === 0) {
        containerPending.innerHTML = `<p style="font-size: 10px; color: #A0AEC0; text-align: center; padding: 6px; font-weight: 700;">No hay solicitudes pendientes.</p>`;
    } else {
        containerPending.innerHTML = '';
        pendingTutors.forEach(tutor => {
            const item = document.createElement('div');
            item.style.cssText = "background: #F8FAFC; border: 1.5px solid #CBD5E0; padding: 10px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;";
            item.innerHTML = `
                <div><strong style="font-size: 10px; font-weight: 900; color: var(--primary-dark);">${tutor.name}</strong><span style="font-size: 9px; color: #718096; display: block; font-weight: 600;">${tutor.user}</span></div>
                <div style="display: flex; gap: 6px;">
                    <button onclick="approveTutor(${tutor.id})" style="background: #31C48D; color: white; border: none; padding: 5px 10px; border-radius: 8px; font-size: 9px; font-weight: 900; cursor: pointer;">Aprobar</button>
                    <button onclick="rejectTutor(${tutor.id})" style="background: #E02424; color: white; border: none; padding: 5px 10px; border-radius: 8px; font-size: 9px; font-weight: 900; cursor: pointer;">Rechazar</button>
                </div>
            `;
            containerPending.appendChild(item);
        });
    }

    if (resolvedCasesLog.length === 0) {
        containerResolved.innerHTML = `<p style="font-size: 10px; color: #A0AEC0; text-align: center; padding: 6px; font-weight: 700;">Aún no hay casos atendidos registrados por los tutores.</p>`;
    } else {
        containerResolved.innerHTML = '';
        resolvedCasesLog.forEach(caso => {
            const logItem = document.createElement('div');
            logItem.style.cssText = "background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 10px; border-radius: 10px; font-size: 9px; color: #2D3748;";
            logItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-weight: 900; color: var(--primary-dark); margin-bottom: 2px;">
                    <span>📌 ${caso.tipo} (${caso.grado})</span>
                    <span style="color: #10B981;">Atendido ✓</span>
                </div>
                <div style="color: #4A5568; font-weight: 600;">Atendido por: <strong>${caso.atendidoPor}</strong></div>
                <div style="color: #718096; font-style: italic; margin-top: 2px;">"${caso.descripcion}"</div>
            `;
            containerResolved.appendChild(logItem);
        });
    }
}

function approveTutor(id) {
    const index = pendingTutors.findIndex(t => t.id === id);
    if (index !== -1) {
        const approvedUser = pendingTutors.splice(index, 1)[0];
        approvedUser.approved = true;
        registeredTutors.push(approvedUser);
        saveDataToStorage();
        renderSupportDashboard();
    }
}

function rejectTutor(id) {
    pendingTutors = pendingTutors.filter(t => t.id !== id);
    saveDataToStorage();
    renderSupportDashboard();
}

function renderGame() {
    const container = document.getElementById('game-options');
    const questionText = document.getElementById('game-question-box');
    const scoreSpan = document.getElementById('game-score');
    const feedbackBox = document.getElementById('game-feedback-box');
    
    scoreSpan.innerText = ecoDaysCount;
    feedbackBox.classList.add('hidden');

    if (dailyChallengeCompleted) {
        questionText.innerText = "🌟 ¡Reto de hoy completado con éxito!";
        container.innerHTML = `
            <div style="background: #DEF7EC; padding: 12px; border-radius: 12px; text-align: center; color: #03543F; font-size: 10px; font-weight: 700;">
                ¡Ya registraste tu día de hoy! Vuelve mañana para sumar tu siguiente día rumbo a la meta de 15 días.
            </div>
            <button onclick="switchView('shop')" class="btn-submit" style="background: var(--accent-yellow); color: var(--primary-dark);">Ver Tienda de Premios 🎁</button>
        `;
        return;
    }

    questionText.innerText = dailyDilemma.question;

    let optionsHtml = '';
    dailyDilemma.options.forEach((opt) => {
        optionsHtml += `
            <button onclick="selectDilemmaOption(${opt.points}, '${opt.feedback}', ${opt.success})" class="duo-option-card">
                <span class="option-icon-box">${opt.icon}</span>
                <span>${opt.text}</span>
            </button>
        `;
    });

    container.innerHTML = optionsHtml;
}

function selectDilemmaOption(points, feedback, success) {
    dailyChallengeCompleted = true;
    if (success) {
        if (ecoDaysCount < 15) {
            ecoDaysCount += 1;
        }
    }
    saveDataToStorage();

    const feedbackBox = document.getElementById('game-feedback-box');
    feedbackBox.innerText = `${feedback} ${success ? `🎉 ¡Día ${ecoDaysCount}/15 registrado con éxito!` : ''}`;
    feedbackBox.style.background = success ? "#DEF7EC" : "#FDE8E8";
    feedbackBox.style.color = success ? "#03543F" : "#9B1C1C";
    feedbackBox.classList.remove('hidden');

    const buttons = document.querySelectorAll('.duo-option-card');
    buttons.forEach(btn => btn.disabled = true);

    setTimeout(() => {
        renderGame();
    }, 2500);
}

function updateShopUI() {
    document.getElementById('shop-coins-balance').innerText = ecoDaysCount;

    const prizes = [
        { id: 'btn-prize-1', cost: 5 },
        { id: 'btn-prize-2', cost: 10 },
        { id: 'btn-prize-3', cost: 15 }
    ];

    prizes.forEach(prize => {
        const btn = document.getElementById(prize.id);
        if (btn) {
            if (ecoDaysCount >= prize.cost) {
                btn.style.background = "var(--accent-orange)";
                btn.style.color = "#1A0A1D";
                btn.style.cursor = "pointer";
                btn.disabled = false;
            } else {
                btn.style.background = "#CBD5E0";
                btn.style.color = "#4A5568";
                btn.style.cursor = "pointer";
                btn.disabled = false;
            }
        }
    });
}

function redeemPrize(cost, prizeName) {
    if (ecoDaysCount >= cost) {
        ecoDaysCount -= cost;
        saveDataToStorage();
        updateShopUI();
        alert(`🎁 ¡Canje exitoso!\nHas obtenido: "${prizeName}". Muestra esta constancia en el kiosko o TOE.`);
    } else {
        alert(`🗓️ ¡Aún te faltan días de racha!\nHas acumulado ${ecoDaysCount} días. Necesitas completar los ${cost} días requeridos para este premio.`);
    }
}