QUIZMASTER - ONLINE EXAMINATION SYSTEM

Files:
  index.html      Website pages and layout
  style.css       Website design
  script.js       Questions, timer, navigation and frontend logic
  ExamServer.java Java HTTP server and result calculation

REQUIREMENT:
  Install JDK 11 or later.

HOW TO RUN (Windows):
  1. Open this folder in VS Code.
  2. Open Terminal > New Terminal.
  3. Compile:
       javac ExamServer.java
  4. Run:
       java ExamServer
  5. Open this address in your browser:
       http://localhost:8080

IMPORTANT:
  Keep the terminal open while using the website. The Java server must be
  running for the Java backend to calculate the result.

This is an educational demonstration. It does not use a database or real
password authentication. Student details are not stored permanently.
