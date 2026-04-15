// src/modules/admin/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSelectedUser } from "./SelectedUserContext";

const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { user } = useContext(AuthContext);
  const { selectedUser } = useSelectedUser();

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastSeenMap, setLastSeenMap] = useState({});

  useEffect(() => {
    if (!user?.user?._id) return;

    if (!socketRef.current) {
      const newSocket = io(`${import.meta.env.VITE_SOCKET_IO_URL}/messages`, {
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log(`Connected to /messages: ${newSocket.id}`);
        newSocket.emit("join", user.user._id);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket error:", err.message);
      });

      newSocket.on("online-users", (users) => {
        setOnlineUsers(users);
      });

      newSocket.on("user-disconnected", ({ userId, lastSeen }) => {
        setLastSeenMap((prev) => ({
          ...prev,
          [userId]: lastSeen,
        }));
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [user?.user?._id]);

  useEffect(() => {
    if (socket && user?.user?._id && selectedUser?._id) {
      socket.emit("joinChatRoom", {
        userId: user?.user?._id,
        selectedUserId: selectedUser._id,
      });
    }
  }, [selectedUser?._id, user?.user?._id, socket]);

  return (
    <SocketContext.Provider value={{ socketRef, socket, onlineUsers, lastSeenMap }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};