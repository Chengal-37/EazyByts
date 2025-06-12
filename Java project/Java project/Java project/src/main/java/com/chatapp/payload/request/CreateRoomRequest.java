package com.chatapp.payload.request;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class CreateRoomRequest {
    @NotBlank(message = "Room name cannot be empty.")
    @Size(min = 3, max = 50, message = "Room name must be between 3 and 50 characters.")
    private String name;

    @Size(max = 255, message = "Description cannot exceed 255 characters.")
    private String description;

    private boolean isPrivate;

    // Optional password for private rooms, not validated here, but in service/controller
    private String password; 

    // Getters and setters (Lombok can generate these if you add @Data, but explicit for clarity)
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean getIsPrivate() { return isPrivate; } // Using getIsPrivate for boolean getter
    public void setIsPrivate(boolean isPrivate) { this.isPrivate = isPrivate; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
