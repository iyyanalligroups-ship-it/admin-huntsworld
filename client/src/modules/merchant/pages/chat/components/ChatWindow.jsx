// import { useContext, useEffect, useState, useRef } from "react";
// import { useSocket } from "../../../context/SocketContext";
// import { useSelectedUser } from "../../../context/SelectedUserContext";
// import MessageInput from "./MessageInput";
// // import { MessageSquare } from "lucide-react";
// import { useGetMessagesQuery, useDeleteMessageMutation, useUpdateMessageMutation } from "@/redux/api/MessageApi";
// import { AuthContext } from "@/modules/landing/context/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Edit, MoreHorizontal, Trash2, MessageSquare, Download, Ban } from 'lucide-react';
// import Zoom from 'react-medium-image-zoom';
// import 'react-medium-image-zoom/dist/styles.css';
// // import { Download } from 'lucide-react';


// import dayjs from 'dayjs';
// import isToday from 'dayjs/plugin/isToday';
// import isYesterday from 'dayjs/plugin/isYesterday';
// dayjs.extend(isToday);
// dayjs.extend(isYesterday);

// function groupMessagesByDate(messages) {
//   const grouped = {};

//   messages.forEach((msg) => {
//     const date = dayjs(msg.createdAt);
//     const key = date.isToday()
//       ? "Today"
//       : date.isYesterday()
//         ? "Yesterday"
//         : date.format("DD MMM YYYY");

//     if (!grouped[key]) grouped[key] = [];
//     grouped[key].push(msg);
//   });

//   return grouped;
// }



// export default function ChatWindow() {
//   const { socketRef } = useSocket();
//   const socket = socketRef?.current;
//   const { selectedUser } = useSelectedUser();
//   const { user } = useContext(AuthContext);
//   const [messages, setMessages] = useState([]);
//   const [editMessage, setEditMessage] = useState(null);
//   const [atBottom, setAtBottom] = useState(true); // Track if the user is at the bottom
//   const [isEditing, setIsEditing] = useState(false);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [messageToDelete, setMessageToDelete] = useState(null);
//   const [editMessageId, setEditMessageId] = useState(null);
//   const messageContainerRef = useRef(null);
//   const [fileType, setFileType] = useState(null);
//   const bottomRef = useRef(null);

//   const pageSize = 15;
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   // Fetch messages from DB when selectedUser changes
//   const { data, isSuccess, isFetching } = useGetMessagesQuery(
//     {
//       userId: user?.user?._id,
//       chatPartnerId: selectedUser?._id,
//       page,
//       pageSize,
//     },
//     { skip: !selectedUser }
//   );

//   const [updateMessage] = useUpdateMessageMutation();
//   const [deleteMessage] = useDeleteMessageMutation();

//   useEffect(() => {
//     if (messageContainerRef.current) {
//       setMessages([]); // Optionally clear messages before loading new ones
//       scrollToBottom(); // Scroll to the bottom after selecting a user
//     }
//   }, [selectedUser]); // Trigger on selectedUser change

//   // When DB data comes, set as initial messages
//   useEffect(() => {
//     if (isSuccess && data) {
//       const formatted = data.map((msg) => ({
//         ...msg,
//         fromMe: msg.sender === user?.user?._id,
//       }));
//       setMessages(formatted);
//       // Scroll after setting messages
//       setTimeout(scrollToBottom, 0);
//     }
//   }, [isSuccess, data, user?.user?._id]);
//   const groupedMessages = groupMessagesByDate(messages);

//   // Real-time message handler
//   useEffect(() => {
//     if (!socket || !selectedUser) return;

//     const handleReceiveMessage = (msg) => {
//       // Only add if the message is from/to current selected user
//       const isRelated =
//         (msg.sender === user?.user?._id && msg.receiver === selectedUser._id) ||
//         (msg.sender === selectedUser._id && msg.receiver === user?.user?._id);

//       if (isRelated) {
//         setMessages((prev) => [
//           ...prev,
//           { ...msg, fromMe: msg.sender === user?.user?._id },
//         ]);
//         // Scroll to bottom when a new message arrives
//         if (messageContainerRef.current && atBottom) {
//           messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
//         }
//       }
//     };

//     socket?.on("receiveMessage", handleReceiveMessage);

//     return () => {
//       socket?.off("receiveMessage", handleReceiveMessage);
//     };
//   }, [socket, selectedUser, user?.user?._id, atBottom]);

//   // Handle marking messages as read
//   useEffect(() => {
//     if (!socket || !selectedUser) return;

//     const handleMarkMessageAsRead = (messageId) => {
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg._id === messageId ? { ...msg, read: true } : msg
//         )
//       );
//     };

//     socket?.on("messageRead", handleMarkMessageAsRead);

//     return () => {
//       socket?.off("messageRead", handleMarkMessageAsRead);
//     };
//   }, [socket, selectedUser]);

//   // Scroll to bottom handler
//   const scrollToBottom = () => {
//     if (bottomRef.current) {
//       bottomRef.current.scrollIntoView({ behavior: 'smooth' });
//     }
//   };

//   // Check if the user is at the bottom of the chat
//   const handleScroll = () => {
//     const container = messageContainerRef.current;
//     if (container) {
//       const isAtBottom =
//         container.scrollHeight - container.scrollTop === container.clientHeight;
//       setAtBottom(isAtBottom);
//     }
//   };
//   const handleEdit = (msg) => {
//     console.log(msg, "edit");
//     setEditMessageId(msg?._id);
//     setIsEditing(true);
//     setEditMessage(msg);
//   };

//   const handleEditSubmit = async () => {
//     if (editMessage) {
//       const payload = {
//         messageId: editMessageId,
//         updatedData: editMessage
//       }
//       const res = await updateMessage(payload).unwrap();
//       setIsEditing(false); // Exit editing mode
//       setEditMessage(null);
//     }
//   };

//   // Handle Delete
//   const handleDeleteConfirm = (msgId) => {
//     setMessageToDelete(msgId);
//     setShowDeleteConfirm(true);
//   };

//   const handleDelete = async () => {
//     if (messageToDelete) {
//       const res = await deleteMessage({ messageId: messageToDelete }).unwrap();
//       setShowDeleteConfirm(false);
//       setMessageToDelete(null);
//     }
//   };
//   // Automatically scroll to bottom when selectedUser changes
//   useEffect(() => {
//     if (messageContainerRef.current && atBottom) {
//       messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
//     }
//   }, [selectedUser, atBottom]); // Trigger when selectedUser changes

//   // UI fallback
//   if (!selectedUser) {
//     return (
//       <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
//         <MessageSquare className="w-48 h-48 text-gray-500 mb-4" />
//         <p className="text-gray-500 text-sm">
//           Select a user to start the conversation
//         </p>
//       </div>
//     );
//   }
//   const getFileName = (url) => {
//     try {
//       return decodeURIComponent(url.split('/').pop().split('?')[0]);
//     } catch {
//       return 'file';
//     }
//   };

//   // Helper: Download file as blob
//   const handleDownload = async (url) => {
//     try {
//       const response = await fetch(url);
//       const blob = await response.blob();
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = getFileName(url);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     } catch (error) {
//       console.error("Download failed:", error);
//     }
//   };
//   const getMessageType = (content) => {
//     const extension = content?.split('.').pop().toLowerCase();
//     if (!extension) return 'text';

//     if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) { return 'image' };
//     if (['mp4', 'mov', 'webm'].includes(extension)) return 'video';
//     if (['mp3', 'wav', 'ogg', 'webm'].includes(extension)) return 'audio';
//     if (['pdf'].includes(extension)) return 'pdf';
//     if (['txt', 'md'].includes(extension)) return 'textFile';
//     return 'text';
//   };
//   const formatAudioExtension = (url) => {
//     console.log(url, "url");

//     if (!url || typeof url !== 'string') return '';

//     // Replace .webm at the end of the URL with .mp3

//     console.log(url.replace(/\.webm$/, '.mp3'), "formated audio url");

//     return url.replace(/\.webm$/, '.mp3');
//   };

//   return (
//     <div className="flex flex-col flex-1 h-full">
//       <div
//         className="flex-1 overflow-y-scroll p-4 space-y-4 bg-gray-50"
//         ref={messageContainerRef}
//         onScroll={handleScroll}
//       >
//         {/* Grouped messages */}
//         {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
//           <div key={date}>
//             <div className="text-center text-xs text-gray-500 my-2">{date}</div>
//             {msgs.map((msg, i) => (
//               <div key={msg._id || i} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
//                 <div
//                   className={`px-4 py-2 rounded-xl max-w-xs shadow relative mb-2 ${msg.fromMe ? "bg-[#d8fdd1] text-black" : "bg-white"} group`}
//                 >

//                   {msg.deleted ? (
//                     <div className="flex items-center gap-2 text-gray-400 italic cursor-pointer">
//                       <Ban size={16} className="text-red-500" />
//                       <span>This message was deleted</span>
//                     </div>
//                   ) : (
//                     (() => {
//                       const type = getMessageType(msg.content);
//                       const isDownloadable = ['image', 'video', 'audio', 'pdf', 'textFile'].includes(type);

//                       return (
//                         <div className="relative">
//                           {/* Render content */}
//                           {type === 'image' && (
//                             <Zoom>
//                               <img
//                                 src={msg.content}
//                                 alt="Image"
//                                 className="max-w-full w-90 h-40 rounded-lg cursor-zoom-in"
//                               />
//                             </Zoom>
//                           )}

//                           {type === 'video' && (
//                             <video
//                               src={msg.content}
//                               controls
//                               className="max-w-full w-90 h-40 rounded-lg"
//                             />
//                           )}

//                           {type === 'audio' && (
//                             <audio controls>
//                               <source src={formatAudioExtension(msg.content)} type="audio/mp3" />
//                               Your browser does not support the audio element.
//                             </audio>

//                           )}


//                           {type === 'pdf' && (
//                             <a
//                               href={msg.content}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-blue-500 underline"
//                             >
//                               View PDF
//                             </a>
//                           )}

//                           {type === 'textFile' && (
//                             <a
//                               href={msg.content}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-blue-500 underline"
//                             >
//                               View Text File
//                             </a>
//                           )}

//                           {type === 'text' && (
//                             <div>{msg.content}</div>
//                           )}

//                           {/* Download icon only for downloadable types */}
//                           {isDownloadable && (
//                             <button
//                               onClick={() => handleDownload(msg.content)}
//                               className="absolute top-1 right-1 text-gray-500 hover:text-blue-500 hidden group-hover:block"
//                               title="Download"
//                             >
//                               <Download size={18} />
//                             </button>
//                           )}

//                         </div>
//                       );
//                     })()
//                   )}

//                   <div className="text-xs mt-1 flex justify-end gap-1 items-center">
//                     <span>{dayjs(msg.createdAt).format("hh:mm A")}</span>
//                     {msg.fromMe && (
//                       <span className={`${msg.read ? "text-blue-400" : "text-gray-400"}`}>
//                         {msg.read ? "✓✓" : "✓"}
//                       </span>
//                     )}

//                     {/* Hoverable dropdown */}
//                     {msg.fromMe && (
//                       <div className="relative group">
//                         <button className="text-gray-400 hover:text-blue-400">
//                           <MoreHorizontal className="h-5 w-5" />
//                         </button>

//                         {/* Dropdown menu */}
//                         <div className="absolute right-0 z-50  hidden group-hover:block bg-white shadow-md p-2 rounded-lg w-32">
//                           {getMessageType(msg.content) === "text" && (
//                             <div
//                               onClick={() => handleEdit(msg)}
//                               className="flex items-center px-3 py-2 cursor-pointer text-gray-700 hover:bg-gray-100"
//                             >
//                               <Edit className="mr-2" /> Edit
//                             </div>
//                           )}

//                           <div onClick={() => handleDeleteConfirm(msg._id)} className="flex items-center px-3 py-2 cursor-pointer text-gray-700 hover:bg-gray-100">
//                             <Trash2 className="mr-2" /> Delete
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ))}


//         {/* Scroll target for auto-scrolling */}
//         <div ref={bottomRef} />
//       </div>

//       {/* Floating button to scroll to the bottom */}
//       {!atBottom && (
//         <Button
//           className="fixed bottom-20 right-4 bg-white text-black p-3 rounded-full shadow-lg"
//           onClick={scrollToBottom}
//         >
//           ⬇
//         </Button>
//       )}

//       {/* Message Input */}
//       <MessageInput />

//       {/* Edit Message Modal */}
//       {isEditing && (
//         <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
//           <div className="bg-white p-6 rounded-lg w-1/3">
//             <h3 className="text-lg font-semibold mb-4">Edit Message</h3>
//             <textarea
//               className="w-full p-2 border rounded-lg mb-4"
//               value={editMessage.content}
//               onChange={(e) => setEditMessage({ ...editMessage, content: e.target.value })}
//             />
//             <div className="flex justify-between">
//               <Button className="bg-gray-300" onClick={() => setIsEditing(false)}>Cancel</Button>
//               <Button className="bg-blue-500 text-white" onClick={handleEditSubmit}>Save</Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
//           <div className="bg-white p-6 rounded-lg w-1/3">
//             <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
//             <p>Are you sure you want to delete this message?</p>
//             <div className="flex justify-between mt-4">
//               <Button className="bg-gray-300" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
//               <Button className="bg-red-500 text-white" onClick={handleDelete}>Delete</Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import { useContext, useEffect, useState, useRef } from "react";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import MessageInput from "./MessageInput";
import { Edit, MoreHorizontal, Trash2, MessageSquare, Download, Ban } from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useGetMessagesQuery, useDeleteMessageMutation, useUpdateMessageMutation } from "@/redux/api/MessageApi";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

function groupMessagesByDate(messages) {
  const grouped = {};
  messages.forEach((msg) => {
    const date = dayjs(msg.createdAt);
    const key = date.isToday()
      ? "Today"
      : date.isYesterday()
        ? "Yesterday"
        : date.format("DD MMM YYYY");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(msg);
  });
  return grouped;
}

export default function ChatWindow() {
  const { socketRef } = useSocket();
  const socket = socketRef?.current;
  const { selectedUser } = useSelectedUser();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [editMessage, setEditMessage] = useState(null);
  const [atBottom, setAtBottom] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [editMessageId, setEditMessageId] = useState(null);
  const messageContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [opponentTyping, setOpponentTyping] = useState(false);


  const pageSize = 5;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const maxMessages = 95; // Target total messages to fetch

  const { data, isSuccess, isFetching } = useGetMessagesQuery(
    {
      userId: user?.user?._id,
      chatPartnerId: selectedUser?._id,
      page,
      pageSize,
    },
    { skip: !selectedUser }
  );

  const [updateMessage] = useUpdateMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();

  // Reset messages and page when selectedUser changes
  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    scrollToBottom();
  }, [selectedUser]);

  // Append new messages from API
  useEffect(() => {
    if (isSuccess && data?.data) {
      const formatted = data.data.map((msg) => ({
        ...msg,
        fromMe: msg.sender === user?.user?._id,
      }));
      setMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg._id));
        const newMessages = formatted.filter((msg) => !existingIds.has(msg._id));
        // Append new messages (since newer messages come from higher pages)
        return [...prev, ...newMessages];
      });
      // Update hasMore based on the number of messages and total limit
      setHasMore(data.data.length === pageSize && messages.length + formatted.length < maxMessages);
      // Maintain scroll position after loading new messages
      if (page > 1 && messageContainerRef.current) {
        const prevHeight = messageContainerRef.current.scrollHeight;
        setTimeout(() => {
          const newHeight = messageContainerRef.current.scrollHeight;
          messageContainerRef.current.scrollTop = newHeight - prevHeight;
        }, 0);
      } else {
        scrollToBottom();
      }
    }
  }, [isSuccess, data, user?.user?._id]);

  // Scroll handler with pagination trigger at bottom
  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;

    // Check if at bottom
    const isAtBottom =
      Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 1;
    setAtBottom(isAtBottom);

    // Check if within 5% of the bottom
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const threshold = scrollHeight * 0.05; // 5% of scroll height
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold && hasMore && !isFetching && messages.length < maxMessages) {
      setPage((prev) => prev + 1); // Trigger next page fetch
    }
  };

  // Real-time message handler
// ChatWindow.jsx
useEffect(() => {
  if (!socket || !selectedUser) return;

  const handleReceiveMessage = (msg) => {
    console.log("Received message:", msg); // Debug log
    const isRelated =
      (msg.sender === user?.user?._id && msg.receiver === selectedUser._id) ||
      (msg.sender === selectedUser._id && msg.receiver === user?.user?._id);
    if (isRelated) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m._id));
        if (!existingIds.has(msg._id)) {
          return [...prev, { ...msg, fromMe: msg.sender === user?.user?._id }];
        }
        return prev;
      });
      if (atBottom) scrollToBottom();
    }
  };

  socket?.on("receiveMessage", handleReceiveMessage);
  return () => socket?.off("receiveMessage", handleReceiveMessage);
}, [socket, selectedUser, user?.user?._id, atBottom]);

// ChatWindow.jsx
useEffect(() => {
  if (!socket || !selectedUser) return;

  let typingTimeout;
  const handleTyping = (senderId) => {
    if (senderId === selectedUser._id) {
      setOpponentTyping(true);
      // Clear any existing timeout
      clearTimeout(typingTimeout);
      // Set a timeout to stop showing typing indicator after 2 seconds
      typingTimeout = setTimeout(() => {
        setOpponentTyping(false);
      }, 2000);
    }
  };

  const handleStopTyping = (senderId) => {
    if (senderId === selectedUser._id) {
      setOpponentTyping(false);
      clearTimeout(typingTimeout);
    }
  };

  socket.on("typing", handleTyping);
  socket.on("stopTyping", handleStopTyping);

  return () => {
    socket.off("typing", handleTyping);
    socket.off("stopTyping", handleStopTyping);
    clearTimeout(typingTimeout);
  };
}, [socket, selectedUser]);

  // Handle marking messages as read
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleMarkMessageAsRead = (messageId) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, read: true } : msg
        )
      );
    };

    socket?.on("messageRead", handleMarkMessageAsRead);
    return () => socket?.off("messageRead", handleMarkMessageAsRead);
  }, [socket, selectedUser]);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleEdit = (msg) => {
    setEditMessageId(msg?._id);
    setIsEditing(true);
    setEditMessage(msg);
  };

  const handleEditSubmit = async () => {
    if (editMessage) {
      const payload = {
        messageId: editMessageId,
        updatedData: editMessage,
      };
      await updateMessage(payload).unwrap();
      setIsEditing(false);
      setEditMessage(null);
    }
  };

  const handleDeleteConfirm = (msgId) => {
    setMessageToDelete(msgId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (messageToDelete) {
      await deleteMessage({ messageId: messageToDelete }).unwrap();
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
    }
  };

  const getFileName = (url) => {
    try {
      return decodeURIComponent(url.split("/").pop().split("?")[0]);
    } catch {
      return "file";
    }
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = getFileName(url);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed:", error);
    }
  };
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTyping = (senderId) => {
      if (senderId === selectedUser._id) {
        setOpponentTyping(true);
      }
    };

    const handleStopTyping = (senderId) => {
      if (senderId === selectedUser._id) {
        setOpponentTyping(false);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, selectedUser]);

  const getMessageType = (content) => {
    const extension = content?.split(".").pop()?.toLowerCase();
    if (!extension) return "text";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
    if (["mp4", "mov", "webm"].includes(extension)) return "video";
    if (["mp3", "wav", "ogg", "webm"].includes(extension)) return "audio";
    if (["pdf"].includes(extension)) return "pdf";
    if (["txt", "md"].includes(extension)) return "textFile";
    return "text";
  };

  const formatAudioExtension = (url) => {
    if (!url || typeof url !== "string") return "";
    return url.replace(/\.webm$/, ".mp3");
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <MessageSquare className="w-48 h-48 text-gray-500 mb-4" />
        <p className="text-gray-500 text-sm">
          Select a user to start the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-scroll flex-1 h-full ">
      {opponentTyping && (
        <div className="text-sm text-gray-500 italic mb-2">
          {selectedUser.name || "User"} is typing...
        </div>
      )}

      <div
        className="flex-1 overflow-y-scroll p-4 space-y-4 bg-gray-50"
        ref={messageContainerRef}
        onScroll={handleScroll}
        style={{ maxHeight: "calc(100vh - 120px)" }} // Ensure container has a defined height
      >
        {isFetching && page > 1 && (
          <div className="text-center text-gray-500">Loading more messages...</div>
        )}
        {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
          <div key={date}>
            <div className="text-center text-xs text-gray-500 my-2">{date}</div>
            {msgs.map((msg, i) => (
              <div
                key={msg._id || i}
                className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-xl max-w-xs shadow relative mb-2 ${msg.fromMe ? "bg-[#d8fdd1] text-black" : "bg-white"
                    } group`}
                >
                  {msg.deleted ? (
                    <div className="flex items-center gap-2 text-gray-400 italic cursor-pointer">
                      <Ban size={16} className="text-red-500" />
                      <span>This message was deleted</span>
                    </div>
                  ) : (
                    (() => {
                      const type = getMessageType(msg.content);
                      const isDownloadable = ["image", "video", "audio", "pdf", "textFile"].includes(type);
                      return (
                        <div className="relative">
                          {type === "image" && (
                            <Zoom>
                              <img
                                src={msg.content}
                                alt="Image"
                                className="max-w-full w-90 h-40 rounded-lg cursor-zoom-in"
                              />
                            </Zoom>
                          )}
                          {type === "video" && (
                            <video
                              src={msg.content}
                              controls
                              className="max-w-full w-90 h-40 rounded-lg"
                            />
                          )}
                          {type === "audio" && (
                            <audio controls>
                              <source src={formatAudioExtension(msg.content)} type="audio/mp3" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                          {type === "pdf" && (
                            <a
                              href={msg.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              View PDF
                            </a>
                          )}
                          {type === "textFile" && (
                            <a
                              href={msg.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              View Text File
                            </a>
                          )}
                          {type === "text" && <div>{msg.content}</div>}
                          {isDownloadable && (
                            <button
                              onClick={() => handleDownload(msg.content)}
                              className="absolute top-1 right-1 text-gray-500 hover:text-blue-500 hidden group-hover:block"
                              title="Download"
                            >
                              <Download size={18} />
                            </button>
                          )}
                        </div>
                      );
                    })()
                  )}
                  <div className="text-xs mt-1 flex justify-end gap-1 items-center">
                    <span>{dayjs(msg.createdAt).format("hh:mm A")}</span>
                    {msg.fromMe && (
                      <span className={`${msg.read ? "text-blue-400" : "text-gray-400"}`}>
                        {msg.read ? "✓✓" : "✓"}
                      </span>
                    )}
                    {msg.fromMe && (
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-blue-400">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        <div className="absolute right-0 z-50 hidden group-hover:block bg-white shadow-md p-2 rounded-lg w-32">
                          {getMessageType(msg.content) === "text" && (
                            <div
                              onClick={() => handleEdit(msg)}
                              className="flex items-center px-3 py-2 cursor-pointer text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="mr-2" /> Edit
                            </div>
                          )}
                          <div
                            onClick={() => handleDeleteConfirm(msg._id)}
                            className="flex items-center px-3 py-2 cursor-pointer text-gray-700 hover:bg-gray-100"
                          >
                            <Trash2 className="mr-2" /> Delete
                          </div>
                        </div>
                        
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {!atBottom && (
        <Button
          className="fixed bottom-20 right-4 bg-white text-black p-3 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          ⬇
        </Button>
      )}
      <MessageInput
        onTyping={() => {
          socket?.emit("typing", { senderId: user?.user?._id, receiverId: selectedUser?._id });
        }}
        onStopTyping={() => {
          socket?.emit("stopTyping", { senderId: user?.user?._id, receiverId: selectedUser?._id });
        }}
      />

      {isEditing && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h3 className="text-lg font-semibold mb-4">Edit Message</h3>
            <textarea
              className="w-full p-2 border rounded-lg mb-4"
              value={editMessage.content}
              onChange={(e) => setEditMessage({ ...editMessage, content: e.target.value })}
            />
            <div className="flex justify-between">
              <Button className="bg-gray-300" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-500 text-white" onClick={handleEditSubmit}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this message?</p>
            <div className="flex justify-between mt-4">
              <Button className="bg-gray-300" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button className="bg-red-500 text-white" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}