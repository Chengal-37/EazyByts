package com.chatapp.controller;

import com.chatapp.model.ChatRoom;
import com.chatapp.model.User;
import com.chatapp.payload.request.CreateRoomRequest; // NEW
import com.chatapp.payload.request.JoinRoomRequest;   // NEW
import com.chatapp.repository.ChatRoomRepository;
import com.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; // NEW for UNAUTHORIZED
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder; // NEW
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.validation.Valid; // Still needed for DTO validation
import java.util.List;
import java.util.Optional; // NEW

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/rooms")
public class ChatRoomController {
    private static final Logger logger = LoggerFactory.getLogger(ChatRoomController.class);

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired // NEW: Inject PasswordEncoder
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<ChatRoom>> getAllPublicRooms() {
        logger.info("Fetching all public rooms");
        // This method will now fetch both public and private rooms.
        // Frontend will filter them for display (e.g., showing lock icon for private).
        // If you only want to return PUBLIC rooms here, keep findByIsPrivateFalse()
        return ResponseEntity.ok(chatRoomRepository.findAll()); // Changed to findAll() to send all rooms to frontend for private logic
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> createRoom(@Valid @RequestBody CreateRoomRequest createRoomRequest) { // Changed to DTO
        try {
            logger.info("Creating new room: {}", createRoomRequest.getName());
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            logger.debug("Current user: {}", username);
            
            User currentUser = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            ChatRoom chatRoom = new ChatRoom();
            chatRoom.setName(createRoomRequest.getName());
            chatRoom.setDescription(createRoomRequest.getDescription());
            chatRoom.setPrivate(createRoomRequest.getIsPrivate()); // Use getIsPrivate from DTO

            // NEW: Handle password for private rooms
            if (createRoomRequest.getIsPrivate()) {
                if (createRoomRequest.getPassword() == null || createRoomRequest.getPassword().isEmpty()) {
                    return ResponseEntity.badRequest().body("Private rooms require a password.");
                }
                if (createRoomRequest.getPassword().length() < 6) {
                    return ResponseEntity.badRequest().body("Password must be at least 6 characters.");
                }
                chatRoom.setPasswordHash(passwordEncoder.encode(createRoomRequest.getPassword()));
            } else {
                chatRoom.setPasswordHash(null); // Ensure no password for public rooms
            }

            chatRoom.setCreatedBy(currentUser);
            chatRoom.getParticipants().add(currentUser); // Creator is automatically a participant
            
            ChatRoom savedRoom = chatRoomRepository.save(chatRoom);
            logger.info("Room created successfully with ID: {}", savedRoom.getId());
            
            return ResponseEntity.ok(savedRoom);
        } catch (Exception e) {
            logger.error("Error creating room: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error creating room: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRoom(@PathVariable Long id) {
        logger.info("Fetching room with ID: {}", id);
        Optional<ChatRoom> room = chatRoomRepository.findById(id);
        if (room.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        ChatRoom chatRoom = room.get();
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        // Allow access to private rooms only if the current user is a participant
        if (chatRoom.isPrivate() && (currentUser == null || !chatRoom.getParticipants().contains(currentUser))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access to private room denied. You are not a participant.");
        }
        
        return ResponseEntity.ok(chatRoom);
    }


    // NEW: Endpoint to join a private room
    @PostMapping("/{roomId}/join")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> joinPrivateRoom(@PathVariable Long roomId, @Valid @RequestBody JoinRoomRequest joinRoomRequest) {
        try {
            logger.info("Attempting to join room {} with password validation.", roomId);
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                    .orElseThrow(() -> new RuntimeException("Room not found."));

            if (!chatRoom.isPrivate()) {
                // If it's a public room, no password needed, just add participant
                chatRoom.getParticipants().add(currentUser);
                chatRoomRepository.save(chatRoom);
                logger.info("User {} joined public room {}.", username, roomId);
                return ResponseEntity.ok("Successfully joined public room.");
            }

            // Private room logic: check password
            if (chatRoom.getPasswordHash() == null || !passwordEncoder.matches(joinRoomRequest.getPassword(), chatRoom.getPasswordHash())) {
                logger.warn("Failed join attempt for private room {}: Invalid password provided by user {}", roomId, username);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid password for private room.");
            }

            // Password matches, add user to participants
            chatRoom.getParticipants().add(currentUser);
            chatRoomRepository.save(chatRoom);
            logger.info("User {} successfully joined private room {}.", username, roomId);
            return ResponseEntity.ok("Successfully joined private room.");

        } catch (Exception e) {
            logger.error("Error joining room {}: {}", roomId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error joining room: " + e.getMessage());
        }
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @chatRoomRepository.findById(#id).get().createdBy.username == authentication.principal.username")
    public ResponseEntity<?> updateRoom(@PathVariable Long id, @Valid @RequestBody ChatRoom chatRoom) {
        logger.info("Updating room with ID: {}", id);
        return chatRoomRepository.findById(id)
                .map(existingRoom -> {
                    existingRoom.setName(chatRoom.getName());
                    existingRoom.setDescription(chatRoom.getDescription());
                    existingRoom.setPrivate(chatRoom.isPrivate());
                    // Only update password hash if a new one is provided and it's a private room
                    // This logic assumes `chatRoom` parameter might carry a new password.
                    // A better approach for updates might be a separate DTO for update
                    // that only contains fields allowed for update.
                    // For simplicity, if chatRoom.getPasswordHash() is not null/empty,
                    // assume it's a new password and hash it.
                    if (chatRoom.isPrivate() && chatRoom.getPasswordHash() != null && !chatRoom.getPasswordHash().isEmpty()) {
                        existingRoom.setPasswordHash(passwordEncoder.encode(chatRoom.getPasswordHash()));
                    } else if (!chatRoom.isPrivate()) {
                        existingRoom.setPasswordHash(null); // Clear password if room becomes public
                    }
                    return ResponseEntity.ok(chatRoomRepository.save(existingRoom));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @chatRoomRepository.findById(#id).get().createdBy.username == authentication.principal.username")
    public ResponseEntity<?> deleteRoom(@PathVariable Long id) {
        logger.info("Deleting room with ID: {}", id);
        return chatRoomRepository.findById(id)
                .map(room -> {
                    chatRoomRepository.delete(room);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/participants/{username}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> addParticipant(@PathVariable Long id, @PathVariable String username) {
        logger.info("Adding participant {} to room {}", username, id);
        return chatRoomRepository.findById(id)
                .map(room -> {
                    userRepository.findByUsername(username)
                            .ifPresent(user -> {
                                room.getParticipants().add(user);
                                chatRoomRepository.save(room);
                            });
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/participants/{username}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> removeParticipant(@PathVariable Long id, @PathVariable String username) {
        logger.info("Removing participant {} from room {}", username, id);
        return chatRoomRepository.findById(id)
                .map(room -> {
                    userRepository.findByUsername(username)
                            .ifPresent(user -> {
                                room.getParticipants().remove(user);
                                chatRoomRepository.save(room);
                            });
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}