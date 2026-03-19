#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include <chrono>
#include <thread>
#include <httplib.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;
using namespace std::chrono;
// User class to handle login credentials
class User {
private:
    std::string username;
    std::string irisColor;
    std::string birthplace;

public:
    User(std::string uname, std::string iris, std::string place)
        : username(uname), irisColor(iris), birthplace(place) {}

    // Function to verify login credentials
    bool verifyLogin(const std::string& uname, const std::string& iris, const std::string& place) {
        return (uname == username && iris == irisColor && place == birthplace);
    }
};

// Global default user
User defaultUser("user1", "blue", "pune");
struct Point {
    double x, y;
};

class PatternVerifier {
public:
    // Function to check if the given pattern forms a square
    static bool isSquare(const std::vector<Point>& points) {
        if (points.size() != 4) return false;  // Must be 4 points

        double d1 = distance(points[0], points[1]);
        double d2 = distance(points[1], points[2]);
        double d3 = distance(points[2], points[3]);
        double d4 = distance(points[3], points[0]);

        bool equalSides = isEqual(d1, d2) && isEqual(d2, d3) && isEqual(d3, d4);

        double angle1 = angle(points[0], points[1], points[2]);
        double angle2 = angle(points[1], points[2], points[3]);
        double angle3 = angle(points[2], points[3], points[0]);
        double angle4 = angle(points[3], points[0], points[1]);

        bool rightAngles = isRightAngle(angle1) && isRightAngle(angle2) &&
                           isRightAngle(angle3) && isRightAngle(angle4);

        return equalSides && rightAngles;
    }

private:
    static double distance(const Point& p1, const Point& p2) {
        return std::sqrt(std::pow(p2.x - p1.x, 2) + std::pow(p2.y - p1.y, 2));
    }

    static bool isEqual(double a, double b, double tolerance = 0.1) {
        return std::abs(a - b) < tolerance;
    }

    static double angle(const Point& p1, const Point& p2, const Point& p3) {
        double dx1 = p2.x - p1.x;
        double dy1 = p2.y - p1.y;
        double dx2 = p3.x - p2.x;
        double dy2 = p3.y - p2.y;
        double dot = dx1 * dx2 + dy1 * dy2;
        double mag1 = std::sqrt(dx1 * dx1 + dy1 * dy1);
        double mag2 = std::sqrt(dx2 * dx2 + dy2 * dy2);
        return std::acos(dot / (mag1 * mag2)) * 180.0 / M_PI;
    }

    static bool isRightAngle(double angle, double tolerance = 10.0) {
        return std::abs(angle - 90.0) < tolerance;
    }
};
class LockManager {
private:
    int failedAttempts;
    bool isLocked;
    steady_clock::time_point lockStart;

public:
    LockManager() : failedAttempts(0), isLocked(false) {}

    void incrementFailures() {
        failedAttempts++;
        if (failedAttempts >= 2) {
            isLocked = true;
            lockStart = steady_clock::now();
        }
    }

    bool checkLock() {
        if (!isLocked) return false;

        auto now = steady_clock::now();
        auto duration = duration_cast<seconds>(now - lockStart).count();

        if (duration >= 30) {
            isLocked = false;
            failedAttempts = 0;
        }
        return isLocked;
    }

    int getLockTimeRemaining() {
        auto now = steady_clock::now();
        auto duration = duration_cast<seconds>(now - lockStart).count();
        return 30 - static_cast<int>(duration);
    }
};

// Global lock manager instance
LockManager lockManager;
void handleLogin(const httplib::Request& req, httplib::Response& res) {
    if (lockManager.checkLock()) {
        json response = { {"status", "fail"}, {"message", "System locked. Please wait " + std::to_string(lockManager.getLockTimeRemaining()) + " seconds."} };
        res.set_content(response.dump(), "application/json");
        return;
    }

    // Parse request JSON
    json request = json::parse(req.body);
    std::string uname = request["username"];
    std::string iris = request["irisColor"];
    std::string place = request["birthplace"];

    // Verify login
    if (defaultUser.verifyLogin(uname, iris, place)) {
        json response = { {"status", "success"}, {"message", "Login approved"} };
        res.set_content(response.dump(), "application/json");
    } else {
        lockManager.incrementFailures();
        json response = { {"status", "fail"}, {"message", "Invalid credentials"} };
        res.set_content(response.dump(), "application/json");
    }
}

void handlePatternVerification(const httplib::Request& req, httplib::Response& res) {
    if (lockManager.checkLock()) {
        json response = { {"status", "fail"}, {"message", "System locked. Please wait " + std::to_string(lockManager.getLockTimeRemaining()) + " seconds."} };
        res.set_content(response.dump(), "application/json");
        return;
    }

    // Parse request JSON
    json request = json::parse(req.body);
    std::vector<Point> points = request["pattern"].get<std::vector<Point>>();

    // Verify if the pattern is a square
    if (PatternVerifier::isSquare(points)) {
        json response = { {"status", "success"}, {"message", "Pattern verified"} };
        res.set_content(response.dump(), "application/json");
    } else {
        lockManager.incrementFailures();
        json response = { {"status", "fail"}, {"message", "Incorrect pattern"} };
        res.set_content(response.dump(), "application/json");
    }
}

int main() {
    httplib::Server svr;

    // Define routes
    svr.Post("/api/login", handleLogin);
    svr.Post("/api/pattern", handlePatternVerification);

    std::cout << "Server is running at http://localhost:8080" << std::endl;
    svr.listen("localhost", 8080);

    return 0;
}