import { useContext, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useGetAllUsersQuery, useMarkAsReadMutation } from "@/redux/api/MessageApi";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSocket } from "@/modules/admin/context/SocketContext";
import UserListItemWithLastMessage from "./helper/UserListItemWithLastMessage";

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { socketRef } = useSocket();
  const socket = socketRef?.current;
  const [page, setPage] = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const { selectedUser, setSelectedUser } = useSelectedUser();
  const [markAsRead] = useMarkAsReadMutation();

  const { data, isFetching, isSuccess, refetch } = useGetAllUsersQuery({
    userId: user?.user?._id,
    page,
    limit: 10,
  });

  // Merge new users into the list (avoiding duplicates)
  useEffect(() => {
    if (isSuccess && data?.users?.length) {
      setAllUsers((prev) => {
        const existingIds = new Set(prev.map((user) => user._id));
        const newUsers = data.users.filter((user) => !existingIds.has(user._id));
        return [...prev, ...newUsers];
      });
    }
  }, [data, isSuccess]);

  // Infinite scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isFetching || !data?.totalPages) return;

      const { scrollTop, clientHeight, scrollHeight } = container;
      if ((scrollTop + clientHeight) / scrollHeight >= 0.98 && page < data.totalPages) {
        setPage((prev) => prev + 1);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [data?.totalPages, isFetching, page]);

  // Socket listeners: receive new messages
  useEffect(() => {
    if (!socket || !user?.user?._id) return;

    const handleReceiveMessage = (msg) => {
      if (msg.receiver === user.user._id && msg.sender !== selectedUser?._id) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u._id === msg.sender
              ? {
                  ...u,
                  unreadCount: (u.unreadCount || 0) + 1,
                  lastMessage: msg.content,
                  lastMessageTime: msg.createdAt,
                }
              : u
          )
        );
      }
    };

    const handleMessageRead = ({ userId, selectedUserId }) => {
      if (userId === user.user._id && selectedUserId === selectedUser?._id) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u._id === selectedUserId ? { ...u, unreadCount: 0 } : u
          )
        );
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messagesRead", handleMessageRead);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesRead", handleMessageRead);
    };
  }, [socket, user?.user?._id, selectedUser?._id]);

  // Mark messages as read when selected user changes
  useEffect(() => {
    if (selectedUser?._id && user?.user?._id) {
      (async () => {
        try {
          await markAsRead({
            userId: user.user._id,
            selectedUserId: selectedUser._id,
          }).unwrap();
          refetch();
        } catch (err) {
          console.error("Failed to mark messages as read:", err);
        }
      })();
    }
  }, [selectedUser?._id]);

  // Filter by name
  const filteredUsers = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-72 bg-gray-100 border-r h-full flex flex-col p-2">
      <Input
        placeholder="Search users..."
        className="mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div ref={containerRef} className="space-y-2 overflow-y-scroll" style={{ height: "560px" }}>
        {filteredUsers.map((u) => (
          <UserListItemWithLastMessage
            key={u._id}
            user={u}
            currentUserId={user?.user?._id}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            unreadCount={u.unreadCount || 0}
          />
        ))}
        {isFetching && (
          <p className="text-center text-xs text-gray-500 py-2">Loading more users...</p>
        )}
      </div>
    </div>
  );
}
