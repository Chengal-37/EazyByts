let currentRoom = null;
// NEW: Global variable to store the room that is currently attempting to be joined (for password modal)
let pendingPrivateRoom = null;

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
}

function initializeCurrentUser() {
    const userStr = localStorage.getItem('user');
    const tokenStr = localStorage.getItem('token');
    if (userStr && tokenStr) {
        window.currentUser = JSON.parse(userStr);
        console.log('Current user initialized:', window.currentUser);
    } else {
        console.warn('User or token not found in localStorage');
    }
}

async function loadChatRooms() {
    try {
        const response = await fetch(`${window.API_URL}/rooms`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load rooms: ${response.status} - ${errorText}`);
        }

        const rooms = await response.json();
        const roomList = document.getElementById('roomList');
        roomList.innerHTML = '';

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            // NEW: Add a lock icon if it's a private room
            const lockIcon = room.isPrivate ? '<span class="ms-2 badge bg-secondary"><i class="fas fa-lock"></i> Private</span>' : '';
            roomElement.innerHTML = `
                <h6>${room.name} ${lockIcon}</h6>
                <small>${room.description || ''}</small>
            `;
            roomElement.addEventListener('click', (event) => selectRoom(room, event));
            roomList.appendChild(roomElement);
        });
    } catch (error) {
        console.error(error);
        alert('Failed to load chat rooms');
    }
}

async function selectRoom(room, event) {
    if (!window.currentUser) {
        alert('Please log in to access chat rooms');
        return;
    }

    // Deselect any currently active room
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    // Add 'active' class to the clicked room element
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // NEW: Handle private rooms
    if (room.isPrivate) {
        // If it's a private room, prompt for password
        pendingPrivateRoom = room; // Store the room being attempted to join
        const joinPrivateRoomModal = new bootstrap.Modal(document.getElementById('joinPrivateRoomModal'));
        document.getElementById('joinRoomPassword').value = ''; // Clear previous password
        document.getElementById('joinPrivateRoomForm').classList.remove('was-validated'); // Reset validation
        joinPrivateRoomModal.show();
    } else {
        // Public room: proceed directly
        localStorage.setItem('currentRoom', JSON.stringify(room));
        currentRoom = room;
        document.getElementById('currentChatName').textContent = room.name;
        loadMessages(room.id);
        
        if (typeof window.connectWebSocket === 'function') { 
            window.connectWebSocket();
        } else {
            console.warn('WebSocket connect function (connectWebSocket) not found. Ensure websocket.js is loaded before chat.js.');
        }
    }
}

// NEW: Function to authenticate and join a private room
async function authenticateAndJoinPrivateRoom(roomId, password) {
    try {
        const response = await fetch(`${window.API_URL}/rooms/${roomId}/join`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ password }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = "Failed to join private room. Please check the password.";
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                // Not JSON, use raw text or default
            }
            throw new Error(errorMessage);
        }

        console.log('Successfully joined private room.');
        return true; // Indicate success
    } catch (error) {
        console.error('Error joining private room:', error);
        alert('Failed to join room: ' + error.message);
        return false; // Indicate failure
    }
}

async function loadMessages(roomId) {
    try {
        const response = await fetch(`${window.API_URL}/messages/room/${roomId}`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load messages: ${response.status} - ${errorText}`);
        }

        const messages = await response.json();
        displayMessages(messages);
    } catch (error) {
        console.error(error);
        alert('Failed to load messages');
    }
}

// Make displayMessages function globally accessible if websocket.js needs to call it
// (which it does, for onMessageReceived)
window.displayMessages = function(messages) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = '';

    let lastDate = null;

    // NEW: Determine if the current room is private to apply special styling
    const isCurrentRoomPrivate = currentRoom && currentRoom.isPrivate;

    messages.forEach(message => {
        const sentDate = new Date(message.sentAt);
        const messageDate = sentDate.toLocaleDateString();

        // Add date separator if the date changes
        if (messageDate !== lastDate) {
            const dateSeparator = document.createElement('div');
            dateSeparator.className = 'date-separator';
            dateSeparator.innerHTML = `<span>${messageDate}</span>`;
            messageArea.appendChild(dateSeparator);
            lastDate = messageDate;
        }

        // Determine if the message was sent by the current user
        const isSent = window.currentUser && message.sender?.username === window.currentUser.username;

        // Create a wrapper for the message bubble to handle alignment (flexbox)
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${isSent ? 'sent-wrapper' : 'received-wrapper'}`;
        // NEW: Add a specific class if the current room is private
        if (isCurrentRoomPrivate) {
            messageWrapper.classList.add('private-room-message-wrapper');
        }
        // Store the full sentAt timestamp for future date comparisons in appendMessage
        messageWrapper.dataset.sentAt = message.sentAt; 

        // Create the actual message bubble element
        const messageBubble = document.createElement('div');
        messageBubble.className = `message ${isSent ? 'sent' : 'received'}`;
        // NEW: Also add a specific class to the bubble itself if desired
        if (isCurrentRoomPrivate) {
             messageBubble.classList.add('private-room-message');
        }

        // Populate the message bubble with sender name, content, and time
        const senderName = message.sender.username || message.sender; // Handle both object and string sender
        messageBubble.innerHTML = `
            <div class="sender">${senderName}</div>
            <div class="text">${message.content}</div>
            <div class="time">${sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;

        // Append the message bubble to its wrapper, then append the wrapper to the message area
        messageWrapper.appendChild(messageBubble);
        messageArea.appendChild(messageWrapper);
    });

    // Scroll to the bottom to show the latest messages
    messageArea.scrollTop = messageArea.scrollHeight;
};

// Function to append a single new message (e.g., from WebSocket)
window.appendMessage = function(message) { // Also made globally accessible for stompClient.send optimistic update
    const messageArea = document.getElementById('messageArea');
    const sentDate = new Date(message.sentAt);
    const messageDate = sentDate.toLocaleDateString();

    // Find the date of the very last message currently displayed in the `messageArea`.
    const lastMessageInDOM = messageArea.querySelector('.message-wrapper:last-of-type');
    let lastDateInDOM = null;
    if (lastMessageInDOM) {
        const lastSentDateString = lastMessageInDOM.dataset.sentAt;
        if (lastSentDateString) {
           lastDateInDOM = new Date(lastSentDateString).toLocaleDateString();
        }
    }

    if (lastDateInDOM === null || messageDate !== lastDateInDOM) {
        const dateSeparator = document.createElement('div');
        dateSeparator.className = 'date-separator';
        dateSeparator.innerHTML = `<span>${messageDate}</span>`;
        messageArea.appendChild(dateSeparator);
    }

    // Determine if the message was sent by the current user
    const isSent = window.currentUser && (message.sender === window.currentUser.username || message.sender?.username === window.currentUser.username);

    // NEW: Determine if the current room is private to apply special styling
    const isCurrentRoomPrivate = currentRoom && currentRoom.isPrivate;

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message-wrapper ${isSent ? 'sent-wrapper' : 'received-wrapper'}`;
    // NEW: Add a specific class if the current room is private
    if (isCurrentRoomPrivate) {
        messageWrapper.classList.add('private-room-message-wrapper');
    }
    // Store the full sentAt timestamp for future date comparisons
    messageWrapper.dataset.sentAt = message.sentAt;

    const messageBubble = document.createElement('div');
    messageBubble.className = `message ${isSent ? 'sent' : 'received'}`;
    // NEW: Also add a specific class to the bubble itself if desired
    if (isCurrentRoomPrivate) {
        messageBubble.classList.add('private-room-message');
    }

    const senderName = message.sender.username || message.sender; // Handle both object and string sender
    messageBubble.innerHTML = `
        <div class="sender">${senderName}</div>
        <div class="text">${message.content}</div>
        <div class="time">${sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;

    messageWrapper.appendChild(messageBubble);
    messageArea.appendChild(messageWrapper);
    messageArea.scrollTop = messageArea.scrollHeight;
};

document.getElementById('messageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.currentUser || !currentRoom) {
        alert('Please select a chat room first');
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

    if (content && window.stompClient?.connected) { 
        const message = {
            type: 'CHAT',
            content,
            sender: window.currentUser.username, // Send only username for WebSocket
            chatRoomId: currentRoom.id,
            sentAt: new Date().toISOString() // Include timestamp for immediate local display
        };

        // Optimistically add message to UI
        window.appendMessage(message);

        window.stompClient.send(`/app/chat.room.${currentRoom.id}`, {}, JSON.stringify(message));
        messageInput.value = '';
    } else {
        alert('WebSocket connection is not available or message is empty.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing chat functionality...');
    initializeCurrentUser();

    const createRoomModal = new bootstrap.Modal(document.getElementById('createRoomModal'));
    const createRoomForm = document.getElementById('createRoomForm');
    const createRoomBtn = document.getElementById('createRoomBtn');
    // NEW: Get references to new elements for create room modal
    const isPrivateCheckbox = document.getElementById('isPrivate');
    const createRoomPasswordField = document.getElementById('createRoomPasswordField');
    const createRoomPasswordInput = document.getElementById('createRoomPassword');

    // NEW: Toggle password field visibility based on "Private Room" checkbox
    isPrivateCheckbox.addEventListener('change', () => {
        if (isPrivateCheckbox.checked) {
            createRoomPasswordField.style.display = 'block';
            createRoomPasswordInput.setAttribute('required', 'true');
            createRoomPasswordInput.setAttribute('minlength', '6'); // Example minimum length
        } else {
            createRoomPasswordField.style.display = 'none';
            createRoomPasswordInput.removeAttribute('required');
            createRoomPasswordInput.removeAttribute('minlength');
            createRoomPasswordInput.value = ''; // Clear password when unchecking
            createRoomPasswordInput.classList.remove('is-invalid', 'is-valid'); // Clear validation state
        }
    });

    // Listener for the Create Room form submission
    createRoomForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Perform client-side validation
        let formIsValid = createRoomForm.checkValidity();
        
        // NEW: Custom validation for private room password
        if (isPrivateCheckbox.checked) {
            if (createRoomPasswordInput.value.length < 6) {
                createRoomPasswordInput.setCustomValidity('Password must be at least 6 characters.');
                formIsValid = false;
            } else {
                createRoomPasswordInput.setCustomValidity(''); // Clear custom validity
            }
        } else {
            createRoomPasswordInput.setCustomValidity(''); // Clear custom validity if not private
        }

        // Apply Bootstrap validation classes
        createRoomForm.classList.add('was-validated');

        if (!formIsValid) {
            return;
        }

        // Disable the button to prevent multiple submissions
        if (createRoomBtn) {
            createRoomBtn.disabled = true;
            createRoomBtn.textContent = 'Creating...';
        }

        try {
            if (!window.currentUser || !localStorage.getItem('token')) {
                alert('Please log in to create a chat room');
                return;
            }

            const name = document.getElementById('roomName').value.trim();
            const description = document.getElementById('roomDescription').value.trim();
            const isPrivate = isPrivateCheckbox.checked;
            // NEW: Get password
            const password = createRoomPasswordInput.value; 

            const roomData = { name, description, isPrivate };
            // NEW: Only send password if it's a private room
            if (isPrivate) {
                roomData.password = password; 
            }

            const response = await fetch(`${window.API_URL}/rooms`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(roomData),
            });

            const responseText = await response.text();

            if (response.ok) {
                const room = JSON.parse(responseText);
                console.log('Room created successfully:', room);
                await loadChatRooms(); // Reload rooms to show the new one
                document.getElementById('createRoomForm').reset(); // Clear form
                createRoomForm.classList.remove('was-validated'); // Reset validation state
                // NEW: Hide password field and remove required attribute after successful creation
                createRoomPasswordField.style.display = 'none'; 
                createRoomPasswordInput.removeAttribute('required'); 
                createRoomPasswordInput.removeAttribute('minlength'); 
                createRoomModal.hide(); // Hide modal
            } else {
                let errorMessage = 'Failed to create room: Unknown error.';
                try {
                    const errorJson = JSON.parse(responseText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (jsonError) {
                    errorMessage = `Failed to create room: ${responseText}`;
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Room creation failed:', error);
            alert(error.message); // Display the specific error message
        } finally {
            // Always re-enable the button and reset text
            if (createRoomBtn) {
                createRoomBtn.disabled = false;
                createRoomBtn.textContent = 'Create Room';
            }
        }
    });

    // NEW: Handle Join Private Room Form submission
    const joinPrivateRoomForm = document.getElementById('joinPrivateRoomForm');
    const joinRoomPasswordInput = document.getElementById('joinRoomPassword');
    const submitJoinRoomPasswordBtn = document.getElementById('submitJoinRoomPasswordBtn');
    const joinPrivateRoomModal = new bootstrap.Modal(document.getElementById('joinPrivateRoomModal'));

    joinPrivateRoomForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Perform client-side validation for the password field
        if (!joinPrivateRoomForm.checkValidity()) {
            joinPrivateRoomForm.classList.add('was-validated');
            return;
        }

        const password = joinRoomPasswordInput.value.trim();
        if (!password) {
            joinRoomPasswordInput.setCustomValidity('Password cannot be empty.');
            joinPrivateRoomForm.classList.add('was-validated');
            return;
        } else {
            joinRoomPasswordInput.setCustomValidity(''); // Clear custom validity
        }

        if (submitJoinRoomPasswordBtn) {
            submitJoinRoomPasswordBtn.disabled = true;
            submitJoinRoomPasswordBtn.textContent = 'Joining...';
        }

        try {
            if (pendingPrivateRoom && await authenticateAndJoinPrivateRoom(pendingPrivateRoom.id, password)) {
                // Successfully authenticated and joined
                localStorage.setItem('currentRoom', JSON.stringify(pendingPrivateRoom));
                currentRoom = pendingPrivateRoom;
                document.getElementById('currentChatName').textContent = pendingPrivateRoom.name;
                loadMessages(pendingPrivateRoom.id);
                
                if (typeof window.connectWebSocket === 'function') { 
                    window.connectWebSocket();
                } else {
                    console.warn('WebSocket connect function (connectWebSocket) not found. Ensure websocket.js is loaded before chat.js.');
                }
                joinPrivateRoomModal.hide();
                joinRoomPasswordInput.value = ''; // Clear password field
                joinPrivateRoomForm.classList.remove('was-validated'); // Reset validation
            } else {
                // Authentication failed, alert handled by authenticateAndJoinPrivateRoom
                joinRoomPasswordInput.classList.add('is-invalid'); // Show validation feedback
            }
        } catch (error) {
            console.error('Error during private room join process:', error);
            // Alert already handled by authenticateAndJoinPrivateRoom
        } finally {
            if (submitJoinRoomPasswordBtn) {
                submitJoinRoomPasswordBtn.disabled = false;
                submitJoinRoomPasswordBtn.textContent = 'Join Room';
            }
            pendingPrivateRoom = null; // Clear pending room regardless of success/failure
        }
    });

    // Load chat rooms only if a user is logged in
    if (window.currentUser && localStorage.getItem('token')) {
        loadChatRooms();
    }
});