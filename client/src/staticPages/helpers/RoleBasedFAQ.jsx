import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "./SellerFAQsidebar";
import FAQContent from "./SellerFAQcontent";
import FAQAdminDialog from "./FAQAdminDialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, LayoutGrid, FileQuestion } from "lucide-react";
import showToast from "@/toast/showToast";
import {
  useGetFaqTopicsForQuestionsQuery,
  useCreateFaqTopicMutation,
  useCreateFaqQuestionMutation,
  useUpdateFaqQuestionMutation,
  useDeleteFaqQuestionMutation,
  useGetFaqQuestionsForBuyerQuery,
  useGetFaqQuestionsForSellerQuery,
  useGetFaqQuestionsForGeneralQuery,
  useGetFaqQuestionsForStudentQuery,
  useGetFaqQuestionsForBaseMemberQuery,
} from "@/redux/api/FAQapi";
import DeleteDialog from "@/model/DeleteModel";

const RoleBasedFAQ = ({ role, pageTitle }) => {
  const queryMap = {
    buyer: useGetFaqQuestionsForBuyerQuery,
    seller: useGetFaqQuestionsForSellerQuery,
    general: useGetFaqQuestionsForGeneralQuery,
    student: useGetFaqQuestionsForStudentQuery,
    baseMember: useGetFaqQuestionsForBaseMemberQuery,
  };

  const useRoleQuery = queryMap[role];
  if (!useRoleQuery) return <div>Invalid role</div>;

  const { data: response, isLoading, refetch } = useRoleQuery();
  const faqData = response?.data || {};
  const topics = Object.keys(faqData);

  const [selectedTopic, setSelectedTopic] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  const { data: topicsData } = useGetFaqTopicsForQuestionsQuery({ type: role });
  const topicOptions = topicsData?.data || [];

  const [createTopic] = useCreateFaqTopicMutation();
  const [createQuestion] = useCreateFaqQuestionMutation();
  const [updateQuestion] = useUpdateFaqQuestionMutation();
  const [deleteQuestion] = useDeleteFaqQuestionMutation();

  // Delete States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // New delete handler
  const openDeleteDialog = (id) => {
    setFaqToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!faqToDelete) return;

    setDeleting(true);
    try {
      await deleteQuestion(faqToDelete).unwrap();
      showToast("FAQ deleted successfully!", "success");
      refetch();
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
    } catch (error) {
      showToast("Failed to delete FAQ", "error");
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setFaqToDelete(null);
  };

  useEffect(() => {
    if (topics.length && !selectedTopic) {
      setSelectedTopic(topics[0]);
    }
  }, [topics]);

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setOpenDialog(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-sans text-slate-800"
    >
      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#0c1f4d]">
              {pageTitle}
            </h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Manage your help center content
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => { setEditingFaq(null); setOpenDialog(true); }}
            className="bg-[#0c1f4d] hover:bg-[#1a2f6d] text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New FAQ
          </Button>
        </div>

        {/* --- MAIN CONTENT CARD --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-[500px] text-[#0c1f4d]">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Loading knowledge base...</p>
            </div>
          ) : topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-center p-8">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <FileQuestion className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No FAQs Created Yet</h3>
              <p className="text-gray-500 max-w-md mb-6">
                Get started by creating your first topic and question to help your users.
              </p>
              <Button
                onClick={() => { setEditingFaq(null); setOpenDialog(true); }}
                className="bg-[#0c1f4d] hover:bg-[#1a2f6d]"
              >
                Create First FAQ
              </Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row h-full">

              {/* SIDEBAR AREA */}
              <div className="w-full lg:w-72 bg-gray-50/50 border-b lg:border-b-0 lg:border-r border-gray-200 p-6 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                  Topics
                </div>
                <Sidebar
                  topics={topics}
                  selectedTopic={selectedTopic}
                  setSelectedTopic={setSelectedTopic}
                />
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white">
                {faqData[selectedTopic]?.length > 0 ? (
                  <FAQContent
                    selectedTopic={selectedTopic}
                    faqs={faqData[selectedTopic]}
                    onEdit={handleEdit}
                    onDelete={openDeleteDialog}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center opacity-60">
                     <FileQuestion className="w-12 h-12 text-gray-300 mb-4" />
                     <p className="text-lg font-medium text-gray-600">No questions in this topic</p>
                     <p className="text-sm text-gray-400">Add a question via the button above</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- DIALOGS --- */}
      <FAQAdminDialog
        open={openDialog}
        setOpen={setOpenDialog}
        role={role}
        topicOptions={topicOptions}
        createTopic={createTopic}
        createQuestion={createQuestion}
        updateQuestion={updateQuestion}
        refetch={refetch}
        editingFaq={editingFaq}
        setEditingFaq={setEditingFaq}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Question?"
        description="Are you sure you want to remove this question? This action cannot be undone."
        isLoading={deleting}
        // Optional: If your DeleteDialog accepts custom button styling
        confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
      />
    </motion.div>
  );
};

export default RoleBasedFAQ;
