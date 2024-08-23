package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	connections = make(map[string]*websocket.Conn)
	mu          sync.Mutex
)

func handleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal("Error while establishing WebSocket connection:", err)
		return
	}

	query := r.URL.Query()
	userID := query.Get("user_id")
	deliverID := query.Get("delivery_id")

	if userID == "" && deliverID == "" {
		conn.Close()
		return
	}

	mu.Lock()
	if deliverID != "" {
		connections[deliverID] = conn
	} else {
		connections[userID] = conn
	}
	mu.Unlock()

	fmt.Println("user id: ", userID)
	fmt.Println("delivery agent id : ", deliverID)
	fmt.Println("connection: ", connections)

	go handleMessages(conn, userID, deliverID)
}

func handleMessages(conn *websocket.Conn, userID, deliverID string) {
	defer conn.Close()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error while reading message:", err)
			break
		}

		// Send message to the corresponding user or delivery agent
		mu.Lock()
		if deliverID != "" {
			if userConn, ok := connections[userID]; ok {
				userConn.WriteMessage(websocket.TextMessage, msg)
			}
		} else {
			if deliverIDConn, ok := connections[deliverID]; ok {
				deliverIDConn.WriteMessage(websocket.TextMessage, msg)
			}
		}
		mu.Unlock()
	}
}

func main() {
	http.HandleFunc("/ws", handleConnection)

	// Log that the server is starting
	log.Println("Starting WebSocket server on port 8080...")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("Error starting server:", err)
	}

	// Log that the server has started successfully
	log.Println("Server started successfully!")
}
