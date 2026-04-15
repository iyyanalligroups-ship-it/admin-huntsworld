// import { useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";
// import UserListItem from "../UserListItem";
// import { useEffect, useState } from "react";
// import { useSocket } from "@/modules/admin/context/SocketContext";

// export default function UserListItemWithLastMessage({
//   user,
//   currentUserId,
//   selectedUser,
//   setSelectedUser,
//   unreadCount,
// }) {
//   const { socketRef } = useSocket();
//   const socket = socketRef?.current;
//   // Only fetch if parent data is missing
//   const shouldFetch = !user.lastMessage && !user.lastMessageDeleted;
//   const { data: lastMsgData, isLoading, refetch } = useGetLastMessageBetweenUsersQuery(
//     {
//       userId: currentUserId,
//       contactId: user._id,
//     },
//     {
//       skip: !currentUserId || !user._id || !shouldFetch,
//     }
//   );

//   console.log("lastMsgData:", lastMsgData); // Debug log
//   console.log("selectedUser:", selectedUser, "user._id:", user._id); // Debug log
//   console.log("Using parent data:", { lastMessage: user.lastMessage, lastMessageTime: user.lastMessageTime });

//   const [lastMessageState, setLastMessageState] = useState({
//     message: user.lastMessage || (isLoading ? "Loading..." : lastMsgData?.lastMessage || "No messages"),
//     time: user.lastMessageTime || (lastMsgData?.timestamp || ""),
//     deleted: user.lastMessageDeleted || false,
//   });

//   useEffect(() => {
//     setLastMessageState({
//       message: user.lastMessage || (isLoading ? "Loading..." : lastMsgData?.lastMessage || "No messages"),
//       time: user.lastMessageTime || (lastMsgData?.timestamp || ""),
//       deleted: user.lastMessageDeleted || false,
//     });
//   }, [user.lastMessage, user.lastMessageTime, user.lastMessageDeleted, lastMsgData, isLoading]);

//   // Socket listener for new messages (real-time update)
//   useEffect(() => {
//     if (socket) {
//       const handleNewMessage = (msg) => {
//         const isRelevant =
//           (msg.from === user._id && msg.to === currentUserId) ||
//           (msg.from === currentUserId && msg.to === user._id);
//         if (isRelevant) {
//           setLastMessageState((prev) => ({
//             ...prev,
//             message: msg.content,
//             time: msg.timestamp,
//             deleted: false,
//           }));
//         }
//       };

//       socket.on("new_message", handleNewMessage);

//       return () => {
//         socket.off("new_message", handleNewMessage);
//       };
//     }
//   }, [socket, user._id, currentUserId]);

//   // Socket listener for deleted messages (real-time update)
//   useEffect(() => {
//     if (socket) {
//       const handleMessageDeleted = (data) => {
//         const isRelevant =
//           (data.from === user._id && data.to === currentUserId) ||
//           (data.from === currentUserId && data.to === user._id);
//         if (isRelevant && data.isLast) {
//           setLastMessageState((prev) => ({
//             ...prev,
//             deleted: true,
//           }));
//           // Optional: Refetch to sync with server
//           refetch();
//         }
//       };

//       socket.on("message_deleted", handleMessageDeleted);

//       return () => {
//         socket.off("message_deleted", handleMessageDeleted);
//       };
//     }
//   }, [socket, user._id, currentUserId, refetch]);

//   // NEW: Socket listener for updated messages (real-time update for edits)
//   useEffect(() => {
//     if (socket) {
//       const handleMessageUpdated = (data) => {
//         console.log("Received message_updated event:", data); // Debug log
//         const isRelevant =
//           (data.from === user._id && data.to === currentUserId) ||
//           (data.from === currentUserId && data.to === user._id);
//         if (isRelevant && data.isLast) { // Assuming 'isLast' flag from backend to confirm it's the last message
//           setLastMessageState((prev) => ({
//             ...prev,
//             message: data.content, // Updated message content
//             time: data.timestamp, // Updated timestamp
//             deleted: false,
//           }));
//           console.log("Updated last message state:", { message: data.content, time: data.timestamp }); // Debug log
//           // Optional: Refetch to sync with server if needed
//           refetch();
//         }
//       };

//       socket.on("message_updated", handleMessageUpdated);

//       return () => {
//         socket.off("message_updated", handleMessageUpdated);
//       };
//     }
//   }, [socket, user._id, currentUserId, refetch]);

//   const lastMessage = lastMessageState.deleted
//     ? "This message was deleted"
//     : lastMessageState.message;
//   const lastMessageTime = lastMessageState.time;

//   // Refetch only if parent data is missing
//   useEffect(() => {
//     if (shouldFetch && !isLoading && !lastMsgData) {
//       refetch();
//     }
//   }, [shouldFetch, isLoading, lastMsgData, refetch]);

//   // Handle both selectedUser._id and selectedUser.user_id._id
//   const isActive = selectedUser?._id === user._id || selectedUser?.user_id?._id === user._id;

//   return (
//     <div onClick={() => setSelectedUser(user)}>
//       <UserListItem
//         user={{
//           ...user,
//           lastMessage,
//           lastMessageTime,
//           unreadCount: unreadCount || user.unreadCount || 0,
//         }}
//         isActive={isActive}
//       />
//     </div>
//   );
// }

// src/modules/admin/components/chat/helper/UserListItemWithLastMessage.jsx
import { useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";
import UserListItem from "../UserListItem"; // Adjust path if needed: "../UserListItem" or "./UserListItem"
import { useEffect } from "react";

export default function UserListItemWithLastMessage({
  user,
  currentUserId,
  selectedUser,
  onSelect, // or setSelectedUser if you pass it directly
  unreadCount,
}) {
  const { data: lastMsgData, isLoading, refetch } = useGetLastMessageBetweenUsersQuery(
    {
      userId: currentUserId,
      contactId: user._id,
    },
    {
      skip: !currentUserId || !user._id,
    }
  );

  // Determine the actual last message and time (fallback to API if local user prop is incomplete)
  const lastMessage = user.lastMessageDeleted || lastMsgData?.deleted
    ? "This message was deleted"
    : user.lastMessage !== undefined && user.lastMessage !== null
      ? user.lastMessage
      : (isLoading ? "Loading..." : lastMsgData?.lastMessage || "No messages");

  const lastMessageTime = user.lastMessageTime || lastMsgData?.timestamp || "";

  const lastMessageDeleted = user.lastMessageDeleted || lastMsgData?.deleted || false;

  // Refetch if local data seems incomplete
  useEffect(() => {
    if (!user.lastMessage && !user.lastMessageDeleted && !isLoading && !lastMsgData) {
      refetch();
    }
  }, [user.lastMessage, user.lastMessageDeleted, isLoading, lastMsgData, refetch]);

  const isActive = selectedUser?._id === user._id || selectedUser?.user_id?._id === user._id;

  return (
    <div onClick={() => onSelect(user)}>
      <UserListItem
        user={{
          ...user,
          lastMessage,
          lastMessageTime,
          lastMessageDeleted,
          unreadCount: unreadCount || user.unreadCount || 0,
        }}
        isActive={isActive}
      />
    </div>
  );
}
