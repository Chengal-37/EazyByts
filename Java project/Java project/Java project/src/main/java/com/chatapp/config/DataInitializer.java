package com.chatapp.config;

import com.chatapp.model.ERole;
import com.chatapp.model.Role;
import com.chatapp.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(1)
public class DataInitializer implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        logger.info("Initializing roles...");
        
        // Initialize ROLE_USER
        if (!roleRepository.existsByName(ERole.ROLE_USER)) {
            logger.info("Creating ROLE_USER");
            Role userRole = new Role(ERole.ROLE_USER);
            roleRepository.save(userRole);
        }

        // Initialize ROLE_ADMIN
        if (!roleRepository.existsByName(ERole.ROLE_ADMIN)) {
            logger.info("Creating ROLE_ADMIN");
            Role adminRole = new Role(ERole.ROLE_ADMIN);
            roleRepository.save(adminRole);
        }

        logger.info("Role initialization completed");
    }
} 