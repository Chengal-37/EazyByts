// Change 'let stompClient = null;' to 'window.stompClient = null;'
window.stompClient = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function initializeWebSocket() {
    if (window.stompClient && window.stompClient.connected) { // Use window.stompClient
        console.log('WebSocket already connected');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Cannot initialize WebSocket: No JWT token found');
        return;
    }

    const socketUrl = `ws://localhost:8080/ws?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(socketUrl);

    // Assign to window.stompClient here
    window.stompClient = Stomp.over(socket);

    // Disable verbose logging
    window.stompClient.debug = null;

    window.stompClient.connect({}, onConnected, onError);
}

function onConnected() {
    console.log('✅ WebSocket connected');
    reconnectAttempts = 0;

    window.stompClient.subscribe('/topic/public', onMessageReceived);
    window.stompClient.subscribe('/user/queue/messages', onMessageReceived);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser?.username) {
        const joinMessage = {
            type: 'JOIN',
            sender: currentUser.username
        };
        window.stompClient.send('/app/chat.addUser', {}, JSON.stringify(joinMessage));
    }
}

function onError(error) {
    console.error('❌ WebSocket error:', error);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔁 Reconnect attempt ${reconnectAttempts} in 5s`);
        setTimeout(initializeWebSocket, 5000);
    } else {
        console.error('🚫 Max reconnection attempts reached.');
    }
}

function onMessageReceived(payload) {
    try {
        const message = JSON.parse(payload.body);
        const currentRoom = JSON.parse(localStorage.getItem('currentRoom')); // Access currentRoom from localStorage

        // Ensure displayMessages is defined globally (which we already did in chat.js)
        if (window.displayMessages && message.type === 'CHAT' && currentRoom?.id === message.chatRoomId) {
            const newMessage = {
                sender: { username: message.sender },
                content: message.content,
                sentAt: new Date()
            };
            window.displayMessages([newMessage]); // Call globally exposed displayMessages
        }
    } catch (e) {
        console.error('📩 Error parsing message:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        initializeWebSocket();
    } else {
        console.warn('Token missing — skipping WebSocket init.');
    }
});

// Export the function so chat.js can use it
window.connectWebSocket = initializeWebSocket;