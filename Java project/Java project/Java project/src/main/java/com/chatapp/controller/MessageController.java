package com.chatapp.controller;

import com.chatapp.model.Message;
import com.chatapp.model.User;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/private/{username}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getPrivateMessages(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    User currentUser = userRepository.findByUsername(
                            SecurityContextHolder.getContext().getAuthentication().getName())
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    List<Message> messages = messageRepository.findBySenderAndReceiver(currentUser, user);
                    messages.addAll(messageRepository.findBySenderAndReceiver(user, currentUser));
                    return ResponseEntity.ok(messages);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/room/{roomId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getRoomMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(messageRepository.findByChatRoomId(roomId));
    }

    @GetMapping("/unread")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUnreadMessages() {
        User currentUser = userRepository.findByUsername(
                SecurityContextHolder.getContext().getAuthentication().getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(messageRepository.findByReceiverAndIsReadFalse(currentUser));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> markMessageAsRead(@PathVariable Long id) {
        return messageRepository.findById(id)
                .map(message -> {
                    message.setRead(true);
                    return ResponseEntity.ok(messageRepository.save(message));
                })
                .orElse(ResponseEntity.notFound().build());
    }
} 