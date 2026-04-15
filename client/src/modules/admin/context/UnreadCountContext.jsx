// src/modules/admin/context/UnreadCountContext.jsx
import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSocket } from "./SocketContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSelectedUser } from "./SelectedUserContext";
import axios from "axios";

const UnreadCountContext = createContext({
  totalUnread: 0,
  setTotalUnread: () => { },
});

export const UnreadCountProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useSocket();

  const { selectedUser } = useSelectedUser();
  const selectedUserId = selectedUser?.user_id?._id || selectedUser?._id;
  const currentUserId = user?.user?._id;

  const [totalUnread, setTotalUnread] = useState(0);
  const isInitialFetchDone = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const resp = await axios.get(
        `${import.meta.env.VITE_API_URL}/chat/unread-count?userId=${currentUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token || sessionStorage.getItem("token") || user?.token}`,
          },
        }
      );
      if (resp.data.success) {
        const count = Number(resp.data.count) || 0;
        console.log("Initial unread count fetched:", count);

        setTotalUnread((prev) => {
          // If we already have a higher count from a real-time event, don't downgrade
          // unless we are absolutely sure this fetch is newer.
          if (!isInitialFetchDone.current) return count;
          return Math.max(prev, count);
        });
        isInitialFetchDone.current = true;
      }
    } catch (err) {
      console.error("Failed to fetch initial unread count:", err);
    }
  }, [currentUserId, token, user?.token]);

  // const selectedUserId = selectedUser?.user_id?._id || selectedUser?._id;
  // // const currentUserId = user?.user?._id;

  // const fetchUnreadCount = useCallback(async () => {
  //   if (!currentUserId) return;
  //   try {
  //     const res = await axios.get(
  //       `${import.meta.env.VITE_API_URL}/chat/unread-count`,
  //       {
  //         params: { userId: currentUserId },
  //         headers: token ? { Authorization: `Bearer ${token}` } : {},
  //       }
  //     );
  //     setTotalUnread(res.data.count || 0);
  //     console.log("Initial unread count fetched:", res.data.count);
  //   } catch (err) {
  //     console.error("Unread count fetch failed", err);
  //   }
  // }, [currentUserId, token]);

  useEffect(() => {
    if (currentUserId) {
      fetchUnreadCount();
    }
  }, [currentUserId, fetchUnreadCount]);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    console.log("Attaching receiveMessage listener to UnreadCountContext", { socketId: socket.id });

    const handleReceiveMessage = (msg) => {
      console.log("UnreadCountContext received msg:", msg);
      if (!msg._id) return;

      const isForMe = String(msg.receiver) === String(currentUserId);
      const isNotFromOpenChat = !selectedUserId || String(msg.sender) !== String(selectedUserId);

      if (isForMe && isNotFromOpenChat) {
        console.log("Incrementing total unread count");
        setTotalUnread((prev) => Number(prev) + 1);

        // Fallback: If we just went from 0 to 1, or just received a message,
        // let's do a synced fetch after a delay to ensure we are in sync with the DB
        // which might have been slightly behind when the socket fired.
        setTimeout(() => fetchUnreadCount(), 2000);
      }
    };

    const handleMessagesRead = ({ userId, readCount }) => {
      if (String(userId) === String(currentUserId)) {
        console.log("Messages read event, reducing total unread by:", readCount);
        if (readCount !== undefined) {
          setTotalUnread((prev) => Math.max(0, Number(prev) - Number(readCount)));
        } else {
          fetchUnreadCount();
        }
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, currentUserId, selectedUserId, fetchUnreadCount]);

  const value = useMemo(
    () => ({
      totalUnread,
      setTotalUnread,
    }),
    [totalUnread]
  );

  return (
    <UnreadCountContext.Provider value={{ totalUnread, setTotalUnread }}>
      {children}
    </UnreadCountContext.Provider>
  );
};

export const useUnreadCount = () => {
  const context = useContext(UnreadCountContext);
  if (!context) {
    throw new Error("useUnreadCount must be used within UnreadCountProvider");
  }
  return context;
};
