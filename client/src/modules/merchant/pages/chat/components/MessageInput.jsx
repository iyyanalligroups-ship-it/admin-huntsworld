import { Smile, Paperclip, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useState } from "react";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSendMessageMutation, useMarkAsReadMutation } from "@/redux/api/MessageApi";
import ChatAttachmentUploader from "./helper/ChatAttachmentUploader";
import EmojiPicker from 'emoji-picker-react';
import AudioUpload from "./helper/AudioUpload";

export default function MessageInput({ onTyping, onStopTyping }) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // To toggle emoji picker visibility
  const { user } = useContext(AuthContext);
  const { socketRef } = useSocket();
  const socket = socketRef?.current;
  const { selectedUser } = useSelectedUser();
  const [sendMessageToDB] = useSendMessageMutation();
  const [markAsRead, { isLoading: isMarkingRead }] = useMarkAsReadMutation();
// MessageInput.jsx
useEffect(() => {
  if (!content) {
    onStopTyping?.();
    return;
  }

  onTyping?.();

  const timeout = setTimeout(() => {
    onStopTyping?.();
  }, 2000);

  return () => clearTimeout(timeout);
}, [content, onTyping, onStopTyping]);
  useEffect(() => {
    if (user?.user?._id && selectedUser?._id) {
      socket?.emit("joinChatRoom", {
        userId: user?.user?._id,
        selectedUserId: selectedUser._id,
      });

      const markMessagesAsRead = async () => {
        try {
          const payload = {
            userId: user?.user?._id,
            selectedUserId: selectedUser._id,
          };
          const res = await markAsRead(payload).unwrap();
          console.log("✅ Messages marked as read", res);
        } catch (err) {
          console.error("❌ Failed to mark messages as read", err);
        }
      };

      markMessagesAsRead();
    }
  }, [user?.user?._id, selectedUser?._id, socket]);

  const handleSend = async () => {
    if (!content.trim() || !selectedUser || !user?.user?._id) return;

    const messageData = {
      sender: user.user._id,
      receiver: selectedUser._id,
      content,
    };

    // 1. Emit via socket
    socket?.emit("sendMessage", {
      ...messageData,
      fromMe: true,
    });
    onStopTyping?.();
    // 2. Save to DB via RTK
    try {
      await sendMessageToDB(messageData).unwrap();
    } catch (error) {
      console.error("Failed to save message:", error);
    }

    setContent(""); // Clear input
  };

  const onEmojiClick = (event, emojiObject) => {
    console.log(event, 'emoji');

    setContent(prevContent => prevContent + event.emoji); // Ensure previous content is preserved
  };
  const handleAudioUploadComplete = async (audioUrl) => {
    if (!audioUrl || !user?.user?._id || !selectedUser?._id) return;

    const messageData = {
      sender: user.user._id,
      receiver: selectedUser._id,
      content: audioUrl, // Optional

    };

    // 1. Emit via socket
    socket?.emit("sendMessage", { ...messageData, fromMe: true });

    // 2. Save in DB
    try {
      await sendMessageToDB(messageData).unwrap();
    } catch (err) {
      console.error("❌ Error saving audio message", err);
    }
  };


  return (
    <div className="p-4 border-t bg-white flex items-center gap-2 relative">
      {/* Button to toggle emoji picker */}
      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
        <Smile size={20} />
      </button>

      {/* Position the emoji picker */}
      {showEmojiPicker && (
        <div style={{
          position: 'absolute',
          left: '10px',
          bottom: '60px', // 20px below the input field
          zIndex: 10,
        }}>
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* <button><Paperclip size={20} /></button> */}
      <ChatAttachmentUploader />

      {/* Message input field */}
      <Input
        placeholder="Type a message... Enter key to send message"
        className="flex-1"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      {/* Send button */}
      {/* <button onClick={handleSend}>
        <Mic size={20} />
      </button> */}
      <AudioUpload
        senderId={user?.user?._id}
        receiverId={selectedUser?._id}
        onUploadComplete={handleAudioUploadComplete}
      />
    </div>
  );
}
