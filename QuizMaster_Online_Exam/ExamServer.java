import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

/**
 * QuizMaster Java backend.
 * Uses only standard JDK classes (no external libraries required).
 */
public class ExamServer {
    // Correct option indexes: A=0, B=1, C=2, D=3
    private static final int[] ANSWER_KEY = {1, 2, 0, 1, 1, 1, 2, 1, 0, 0};

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/api/submit", ExamServer::handleSubmit);
        server.createContext("/", ExamServer::serveFiles);
        server.setExecutor(null);
        server.start();
        System.out.println("QuizMaster is running at http://localhost:8080");
    }

    private static void handleSubmit(HttpExchange exchange) throws IOException {
        addCors(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 405, "{\"error\":\"POST method required\"}");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        // Extract the answers array sent by script.js.
        int start = body.indexOf("\"answers\"");
        int open = body.indexOf('[', start);
        int close = body.indexOf(']', open);
        if (start < 0 || open < 0 || close < 0) {
            send(exchange, 400, "{\"error\":\"Invalid answer data\"}");
            return;
        }

        String[] values = body.substring(open + 1, close).split(",");
        if (values.length != ANSWER_KEY.length) {
            send(exchange, 400, "{\"error\":\"Expected 10 answers\"}");
            return;
        }

        int correct = 0, unanswered = 0;
        for (int i = 0; i < ANSWER_KEY.length; i++) {
            String value = values[i].trim();
            if ("null".equals(value) || value.isEmpty()) {
                unanswered++;
            } else {
                try {
                    if (Integer.parseInt(value) == ANSWER_KEY[i]) correct++;
                } catch (NumberFormatException ex) {
                    send(exchange, 400, "{\"error\":\"Invalid answer value\"}");
                    return;
                }
            }
        }
        int wrong = ANSWER_KEY.length - correct - unanswered;
        int percentage = correct * 100 / ANSWER_KEY.length;
        String json = String.format(
            "{\"correct\":%d,\"wrong\":%d,\"unanswered\":%d,\"percentage\":%d}",
            correct, wrong, unanswered, percentage
        );
        send(exchange, 200, json);
    }

    private static void serveFiles(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if ("/".equals(path)) path = "/index.html";
        // Prevent path traversal outside the project directory.
        if (path.contains("..") || path.contains("\\\\")) {
            send(exchange, 400, "Invalid path");
            return;
        }
        File file = new File("." + path);
        if (!file.isFile()) {
            send(exchange, 404, "File not found");
            return;
        }
        String type = path.endsWith(".css") ? "text/css" :
                      path.endsWith(".js") ? "application/javascript" : "text/html";
        byte[] data = java.nio.file.Files.readAllBytes(file.toPath());
        exchange.getResponseHeaders().set("Content-Type", type + "; charset=UTF-8");
        exchange.sendResponseHeaders(200, data.length);
        try (OutputStream out = exchange.getResponseBody()) { out.write(data); }
    }

    private static void addCors(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
    }

    private static void send(HttpExchange exchange, int status, String message) throws IOException {
        byte[] data = message.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, data.length);
        try (OutputStream out = exchange.getResponseBody()) { out.write(data); }
    }
}
