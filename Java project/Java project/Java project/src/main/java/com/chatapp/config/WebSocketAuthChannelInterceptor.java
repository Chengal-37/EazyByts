package com.chatapp.config;

import com.chatapp.security.jwt.JwtUtils;
import com.chatapp.security.services.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // Only authenticate on CONNECT frame
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            try {
                String token = (String) accessor.getSessionAttributes().get("token");

                if (token != null && jwtUtils.validateJwtToken(token)) {
                    String username = jwtUtils.getUserNameFromJwtToken(token);
                    var userDetails = userDetailsService.loadUserByUsername(username);

                    var authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    accessor.setUser(authentication);
                    logger.info("WebSocket connection authenticated for user: {}", username);
                } else {
                    logger.warn("WebSocket token is missing or invalid.");
                }

            } catch (Exception e) {
                logger.error("WebSocket authentication failed: {}", e.getMessage());
                // Optionally block connection:
                // return null;
            }
        }

        return message;
    }
}
