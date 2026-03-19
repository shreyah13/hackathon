#include <iostream>
#include <cstring>
#include <sys/types.h>
#include <Winsock2.h>
#include <netinet/in.h>
#include <unistd.h>

using namespace std;

struct User {
    string username;
    string password;
};

User userDatabase = {"user1", "password123"};
bool accessFrozen = false;
time_t freeze_start;

bool verify_username_password(const string& username, const string& password) {
    return username == userDatabase.username && password == userDatabase.password;
}

string send_push_notification() {
    return "Push notification sent! Please approve it.";
}

bool verify_pattern(const string& user_pattern, const string& correct_pattern) {
    return user_pattern == correct_pattern;
}

void freeze_access() {
    accessFrozen = true;
    freeze_start = time(0); // Current time
}

bool is_access_frozen() {
    if (accessFrozen) {
        time_t now = time(0);
        if (difftime(now, freeze_start) >= 1800) { // 30 minutes
            accessFrozen = false;
            return false;
        }
        return true;
    }
    return false;
}

string handle_login(const string& body) {
    string username = "user1";  // Extracted from body (hardcoded here)
    string password = "password123";  // Extracted from body (hardcoded here)

    if (is_access_frozen()) {
        return "Access is frozen. Try again after 30 minutes.";
    }

    if (verify_username_password(username, password)) {
        return send_push_notification();
    }
    return "Invalid username or password.";
}

string handle_pattern_verification(const string& body) {
    string correct_pattern = "012345";  // Example of hardcoded correct pattern
    string user_pattern = "012345";  // Extracted from body (hardcoded here)
    
    static int attempt_count = 0;

    if (verify_pattern(user_pattern, correct_pattern)) {
        attempt_count = 0;
        return "Pattern correct! Access granted.";
    } else {
        attempt_count++;
        if (attempt_count >= 2) {
            freeze_access();
            attempt_count = 0;
            return "Too many incorrect attempts. Access frozen for 30 minutes.";
        }
        return "Incorrect pattern. Try again.";
    }
}

void handle_client(int client_socket) {
    char buffer[1024];
    int recv_len = recv(client_socket, buffer, sizeof(buffer), 0);

    if (recv_len > 0) {
        buffer[recv_len] = '\0';
        string request(buffer);

        string response;
        if (request.find("POST /login") != string::npos) {
            response = handle_login(request);
        } else if (request.find("POST /verify-pattern") != string::npos) {
            response = handle_pattern_verification(request);
        } else {
            response = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
        }

        string http_response = "HTTP/1.1 200 OK\r\nContent-Length: " + to_string(response.size()) + "\r\n\r\n" + response;
        send(client_socket, http_response.c_str(), http_response.size(), 0);
    }

    close(client_socket);
}

int main() {
    int server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket < 0) {
        cerr << "Failed to create socket." << endl;
        return -1;
    }

    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(18080);

    if (bind(server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        cerr << "Binding failed." << endl;
        return -1;
    }

    if (listen(server_socket, 5) < 0) {
        cerr << "Listening failed." << endl;
        return -1;
    }

    cout << "Server running on port 18080..." << endl;

    while (true) {
        int client_socket = accept(server_socket, NULL, NULL);
        if (client_socket < 0) {
            cerr << "Failed to accept connection." << endl;
            continue;
        }

        handle_client(client_socket);
    }

    close(server_socket);
    return 0;
}