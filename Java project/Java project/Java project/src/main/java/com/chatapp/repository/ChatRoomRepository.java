package com.chatapp.repository;

import com.chatapp.model.ChatRoom;
import com.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    List<ChatRoom> findByParticipantsContaining(User user);
    List<ChatRoom> findByIsPrivateFalse(); // Keep this for potential future use
    List<ChatRoom> findByIsPrivateTrue();  // Added for retrieving only private rooms
    List<ChatRoom> findByCreatedBy(User user);
}