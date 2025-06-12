package com.chatapp.payload.request;

import javax.validation.constraints.NotBlank;

public class JoinRoomRequest {
    @NotBlank(message = "Password cannot be empty.")
    private String password;

    // Getters and setters (Lombok can generate these if you add @Data, but explicit for clarity)
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
