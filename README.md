# 💬 Real-Time Chat Application

This is a full-stack real-time chat application developed as part of the **Java Full Stack Developer Internship** at [EazyByts Web Solutions]. It supports user authentication, public/private messaging, and dynamic chat room management using Spring Boot and WebSockets.

---

## 🚀 Features

- ✅ User Registration & Login with JWT Authentication
- ✅ Secure Private & Public Chat Rooms
- ✅ Real-Time Messaging with WebSockets
- ✅ Responsive Frontend using HTML, CSS, and JavaScript
- ✅ Backend APIs with Spring Boot & Spring Security
- ✅ Message History & Chat Room Storage in MySQL
- ✅ Modular Project Structure with MVC and Layered Architecture

---

## 🛠️ Tech Stack

| Layer       | Technology                  |
|-------------|-----------------------------|
| Frontend    | HTML, CSS, JavaScript       |
| Backend     | Java 11, Spring Boot 2.7    |
| Realtime    | WebSockets (STOMP)          |
| Security    | Spring Security, JWT        |
| Database    | MySQL                       |
| ORM         | JPA, Hibernate              |
| Build Tool  | Maven                       |
| Versioning  | Git, GitHub                 |

---

## 🧩 Project Structure

```
ChatApp/
└── Java project/
    └── Java project/
        ├── pom.xml
        ├── src/
        │   └── main/
        │       ├── java/com/chatapp/...   # All Java source code
        │       ├── resources/
        │       │   ├── static/            # Frontend (HTML, JS, CSS)
        │       │   └── application.properties
        └── README.md
```

---

## ⚙️ Setup & Run

### 📦 Prerequisites

- Java 11+
- Maven
- MySQL
- IDE (like IntelliJ or Eclipse)

### 📌 Steps to Run

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Chengal-37/EazyByts.git
   cd EazyByts
   ```

2. **Configure Database**
   Edit `application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/chatapp
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Create Database**
   ```sql
   CREATE DATABASE chatapp;
   ```

4. **Run the Application**
   ```bash
   mvn spring-boot:run
   ```

5. **Access the UI**
   Open `src/main/resources/static/index.html` in your browser (or set up a controller to serve it).

---

## 📹 Demo & Walkthrough

🎥 [Upload your demo video link here]

---

## 📘 What I Learned

- Secure user authentication using Spring Security and JWT
- Real-time communication with STOMP over WebSockets
- RESTful API development with Spring Boot
- Connecting frontend and backend seamlessly
- Full-stack deployment and GitHub collaboration

---

## 📌 Acknowledgments

Special thanks to **EazyByts Web Solutions** for providing this opportunity and mentorship throughout the internship project.

---

## 🏷️ Tags

`#EazyByts` `#FullStackDeveloper` `#SpringBoot` `#ChatApp` `#JavaInternship` `#WebSockets` `#JavaProject`

---
