let db;
let tickets = [];
let currentUser = null;

function showNotification(message, type = 'info', title = '') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    if (!title) {
        switch(type) {
            case 'success': 
                title = 'Успешно!'; 
                break;
            case 'error': 
                title = 'Ошибка!'; 
                break;
            case 'warning': 
                title = 'Внимание!'; 
                break;
            default: 
                title = 'Информация'; 
                break;
        }
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 400);
    });
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 5000);
}

function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('TokyoGhoulDB', 1);
        
        request.onerror = function(event) {
            reject('Ошибка бд');
        };
        
        request.onsuccess = function(event) {
            db = event.target.result;
            resolve(db);
        };
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('tickets')) {
                const ticketStore = db.createObjectStore('tickets', { keyPath: 'id' });
                ticketStore.createIndex('email', 'email', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', { keyPath: 'email' });
                userStore.createIndex('email', 'email', { unique: true });
            }
        };
    });
}

function loadTicketsFromDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('Бд косоебит');
            return;
        }
        
        const transaction = db.transaction(['tickets'], 'readonly');
        const store = transaction.objectStore('tickets');
        const request = store.getAll();
        
        request.onsuccess = function(event) {
            tickets = event.target.result;
            resolve(tickets);
        };
        
        request.onerror = function(event) {
            reject('Ошибка загрузки тикетов');
        };
    });
}
function saveTicketToDB(ticket) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tickets'], 'readwrite');
        const store = transaction.objectStore('tickets');
        const request = store.put(ticket);
        
        request.onsuccess = function() {
            resolve();
        };
        
        request.onerror = function(event) {
            reject('Ошибка сохранения тикета');
        };
    });
}

function deleteTicketFromDB(ticketId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tickets'], 'readwrite');
        const store = transaction.objectStore('tickets');
        const request = store.delete(ticketId);
        
        request.onsuccess = function() {
            resolve();
        };
        
        request.onerror = function(event) {
            reject('Ошибка удаления тикета');
        };
    });
}

function saveUserToDB(user) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.put(user);
        
        request.onsuccess = function() {
            resolve();
        };
        
        request.onerror = function(event) {
            reject('Ошибка сохранения пользователя');
        };
    });
}

function getUserFromDB(email) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.get(email);
        
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        
        request.onerror = function(event) {
            reject('Ошибка получения пользователя');
        };
    });
}

async function checkUserExists(email) {
    try {
        const user = await getUserFromDB(email);
        return !!user;
    } catch (error) {
        return false;
    }
}

async function initAuthSystem() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userDisplay = document.getElementById('userDisplay');
    const authModal = document.getElementById('authModal');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const submitLogin = document.getElementById('submitLogin');
    const submitRegister = document.getElementById('submitRegister');
    
    enhanceAuthForms();
    
    const savedSession = localStorage.getItem('currentUser');
    if (savedSession) {
        try {
            currentUser = JSON.parse(savedSession);
            updateAuthUI();
        } catch (error) {
            localStorage.removeItem('currentUser');
        }
    }
        loginBtn.addEventListener('click', function() {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authModal.style.display = 'flex';
    });
    
    registerBtn.addEventListener('click', function() {
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
        authModal.style.display = 'flex';
    });
    
    closeModal.addEventListener('click', function() {
        authModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
    });
        switchToRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });
    
    switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
    
    submitLogin.addEventListener('click', async function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showNotification('Пожалуйста, заполните все поля', 'warning');
            return;
        }
        
        try {
            const user = await getUserFromDB(email);
            
            if (!user) {
                showNotification('Пользователь с таким email не найден', 'error');
                return;
            }
            
            if (user.password !== password) {
                showNotification('Неверный пароль', 'error');
                return;
            }
            
            currentUser = {
                name: user.name,
                email: user.email
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('currentEmail', email);
            
            updateAuthUI();
            authModal.style.display = 'none';
            
            showNotification(`Добро пожаловать, ${user.name}!`, 'success');
            
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        } catch (error) {
            showNotification('Ошибка при входе: ' + error, 'error');
        }
    });
    
    submitRegister.addEventListener('click', async function() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        
        if (!name || !email || !password || !passwordConfirm) {
            showNotification('Пожалуйста, заполните все поля', 'warning');
            return;
        }
        
        if (password !== passwordConfirm) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        try {
            const exists = await checkUserExists(email);
            
            if (exists) {
                showNotification('Пользователь с таким email уже существует', 'error');
                return;
            }
            
            const newUser = {
                name: name,
                email: email,
                password: password,
                registeredAt: new Date().toISOString()
            };
            
            await saveUserToDB(newUser);
            
            currentUser = {
                name: newUser.name,
                email: newUser.email
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('currentEmail', email);
            
            updateAuthUI();
            authModal.style.display = 'none';
            
            showNotification('Регистрация успешна! Добро пожаловать на сайт!', 'success');
            
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerPasswordConfirm').value = '';
        } catch (error) {
            showNotification('Ошибка при регистрации: ' + error, 'error');
        }
    });
    
    logoutBtn.addEventListener('click', function() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentEmail');
        localStorage.removeItem('isAdmin');
        updateAuthUI();
        showNotification('Вы успешно вышли из системы', 'info');
        location.reload();
    });
}

function enhanceAuthForms() {
    const inputs = document.querySelectorAll('.auth-form input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
        
        if (input.value !== '') {
            input.parentElement.classList.add('focused');
        }
    });
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userDisplay = document.getElementById('userDisplay');
    
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        userDisplay.textContent = currentUser.name;
        userDisplay.style.display = 'inline-block';
        
        const ticketNameInput = document.getElementById('ticketName');
        const ticketEmailInput = document.getElementById('ticketEmail');
        
        if (ticketNameInput && ticketEmailInput) {
            ticketNameInput.value = currentUser.name;
            ticketEmailInput.value = currentUser.email;
        }
    } else {
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        userDisplay.textContent = '';
        userDisplay.style.display = 'none';
    }
}

window.initDatabase = initDatabase;
window.loadTicketsFromDB = loadTicketsFromDB;
window.saveTicketToDB = saveTicketToDB;
window.deleteTicketFromDB = deleteTicketFromDB;
window.getUserFromDB = getUserFromDB;
window.saveUserToDB = saveUserToDB;
window.checkUserExists = checkUserExists;
window.initAuthSystem = initAuthSystem;
window.updateAuthUI = updateAuthUI;
window.showNotification = showNotification; 