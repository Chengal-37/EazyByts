package com.chatapp.controller;
import com.chatapp.model.ChatRoom;
import com.chatapp.model.Message;
import com.chatapp.model.User;
import com.chatapp.payload.request.ChatMessage;
import com.chatapp.repository.ChatRoomRepository;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Optional;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private MessageRepository messageRepository;

    @MessageMapping("/chat.private.{username}")
    public void sendPrivateMessage(@DestinationVariable String username, @Payload ChatMessage chatMessage) {
        Optional<User> sender = userRepository.findByUsername(chatMessage.getSender());
        Optional<User> receiver = userRepository.findByUsername(username);

        if (sender.isPresent() && receiver.isPresent()) {
            Message message = new Message();
            message.setSender(sender.get());
            message.setReceiver(receiver.get());
            message.setContent(chatMessage.getContent());
            message.setSentAt(LocalDateTime.now());
            messageRepository.save(message);

            messagingTemplate.convertAndSendToUser(
                    username,
                    "/queue/messages",
                    chatMessage
            );
        }
    }

    @MessageMapping("/chat.room.{roomId}")
    public void sendRoomMessage(@DestinationVariable Long roomId, @Payload ChatMessage chatMessage) {
        Optional<ChatRoom> chatRoom = chatRoomRepository.findById(roomId);
        Optional<User> sender = userRepository.findByUsername(chatMessage.getSender());

        if (chatRoom.isPresent() && sender.isPresent()) {
            Message message = new Message();
            message.setSender(sender.get());
            message.setChatRoom(chatRoom.get());
            message.setContent(chatMessage.getContent());
            message.setSentAt(LocalDateTime.now());
            messageRepository.save(message);

            messagingTemplate.convertAndSend("/topic/room." + roomId, chatMessage);
        }
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }
}