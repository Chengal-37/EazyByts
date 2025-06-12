// Load from localStorage and make available globally
window.token = localStorage.getItem('token');
window.currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// Helper to return auth headers
function getAuthHeaders() {
    const jwt = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
    };
}

// Check if user is already logged in
if (window.token) {
    showChatInterface();
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${window.API_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const responseText = await response.text();
        const data = JSON.parse(responseText);

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        if (data.accessToken) {
            window.token = data.accessToken;
            window.currentUser = {
                id: data.id,
                username: data.username,
                email: data.email,
                roles: data.roles,
            };

            localStorage.setItem('token', window.token);
            localStorage.setItem('user', JSON.stringify(window.currentUser));

            showChatInterface();

            if (typeof initializeWebSocket === 'function') {
                initializeWebSocket();
            }
        } else {
            throw new Error('No access token received');
        }
    } catch (error) {
        console.error('Login error:', error);
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = error.message || 'Login failed. Please check your credentials and try again.';
        errorDiv.classList.remove('d-none');
    }
});

// Register form submission
document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${window.API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const responseText = await response.text();
        const data = JSON.parse(responseText);

        if (response.ok) {
            alert('Registration successful! Please login.');
            document.getElementById('registerForm').reset();
            document.getElementById('login-tab').click();
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        const errorDiv = document.getElementById('registerError');
        errorDiv.textContent = error.message || 'Registration failed. Please try again.';
        errorDiv.classList.remove('d-none');
    }
});

// Show chat interface and hide auth forms
function showChatInterface() {
    document.getElementById('auth-forms').classList.add('d-none');
    document.getElementById('chat-interface').classList.remove('d-none');

    // Re-fetch globals
    window.token = localStorage.getItem('token');
    window.currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    if (typeof loadChatRooms === 'function') {
        loadChatRooms();
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.token = null;
    window.currentUser = null;

    document.getElementById('chat-interface').classList.add('d-none');
    document.getElementById('auth-forms').classList.remove('d-none');

    if (typeof stompClient !== 'undefined' && stompClient) {
        stompClient.disconnect();
    }
}
