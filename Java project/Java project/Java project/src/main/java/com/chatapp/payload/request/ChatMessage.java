package com.chatapp.payload.request;

import lombok.Data;

@Data
public class ChatMessage {
    private MessageType type;
    private String content;
    private String sender;
    private String receiver;
    private Long chatRoomId;

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE
    }
} 