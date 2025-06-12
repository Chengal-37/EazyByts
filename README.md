# Real-time Chat Application

A full-stack chat application with user authentication, private messaging, and chat room functionality.

## Features

- User authentication and authorization
- Real-time messaging using WebSocket
- Private messaging between users
- Group chat rooms
- Message history
- Online/offline status
- Read receipts
- Responsive design

## Tech Stack

### Backend
- Java 11
- Spring Boot 2.7.0
- Spring Security
- Spring Data JPA
- WebSocket
- MySQL
- JWT Authentication

### Frontend
- HTML5
- CSS3
- JavaScript
- WebSocket Client

## Prerequisites

- Java 11 or higher
- Maven
- MySQL
- Node.js and npm (for frontend)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatapp
   ```

2. **Install and Configure MySQL**
   - Download and install MySQL from [mysql.com](https://dev.mysql.com/downloads/installer/)
   - During installation:
     - Choose "Developer Default" or "Server only" setup type
     - Remember the root password you set
     - Keep the default port (3306)
   - After installation, verify MySQL is running:
     ```bash
     # On Windows, open Command Prompt and run:
     mysql -u root -p
     # Enter your root password when prompted
     
     # Verify MySQL is running:
     mysql> SELECT VERSION();
     
     # Exit MySQL:
     mysql> exit
     ```

3. **Configure Database Connection**
   - Open `src/main/resources/application.properties`
   - Update the database credentials if needed:
     ```properties
     spring.datasource.url=jdbc:mysql://localhost:3306/chatapp?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
     spring.datasource.username=root
     spring.datasource.password=your_password
     ```
   - Replace `your_password` with the root password you set during MySQL installation

4. **Verify MySQL Service**
   - On Windows:
     - Press Win + R
     - Type `services.msc`
     - Look for "MySQL" service
     - Ensure it's running (Status should be "Running")
     - If not, right-click and select "Start"

5. **Run the Application**
   ```bash
   mvn spring-boot:run
   ```
   The application will:
   - Connect to MySQL
   - Create the database if it doesn't exist
   - Create necessary tables automatically
   - Start the web server on port 8080

6. **Access the Application**
   - Open your browser and navigate to `http://localhost:8080`
   - Register a new account or login with existing credentials

## Troubleshooting

### Database Connection Issues
1. Verify MySQL is running
2. Check if you can connect using MySQL command line client
3. Verify username and password in `application.properties`
4. Ensure port 3306 is not blocked by firewall
5. If you get SSL errors, add `useSSL=false` to the database URL

### Application Startup Issues
1. Check Java version: `java -version`
2. Verify Maven installation: `mvn -version`
3. Check application logs for specific error messages

## API Documentation

### Authentication Endpoints
- POST /api/auth/signup - Register new user
- POST /api/auth/signin - Login user
- POST /api/auth/signout - Logout user

### User Endpoints
- GET /api/users/me - Get current user
- GET /api/users/{id} - Get user by ID
- PUT /api/users/me - Update current user

### Message Endpoints
- GET /api/messages/private/{userId} - Get private messages
- POST /api/messages/private - Send private message
- GET /api/messages/room/{roomId} - Get room messages
- POST /api/messages/room - Send room message

### Chat Room Endpoints
- GET /api/rooms - Get all public rooms
- POST /api/rooms - Create new room
- GET /api/rooms/{id} - Get room details
- PUT /api/rooms/{id} - Update room
- DELETE /api/rooms/{id} - Delete room

## WebSocket Endpoints
- /ws - WebSocket connection endpoint
- /ws/private - Private messaging endpoint
- /ws/room - Room messaging endpoint

## Security
- JWT-based authentication
- Password encryption
- Role-based access control
- Secure WebSocket connections

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 