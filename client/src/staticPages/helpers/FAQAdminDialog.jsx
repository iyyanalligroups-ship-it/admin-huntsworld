import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Plus, Save, X, Layers, FileText, PenLine } from "lucide-react";
import showToast from "@/toast/showToast";

const FAQAdminDialog = ({
  open,
  setOpen,
  role,
  topicOptions,
  createTopic,
  createQuestion,
  updateQuestion,
  refetch,
  editingFaq,
  setEditingFaq,
}) => {
  const [mode, setMode] = useState("create"); // create or edit
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionsList, setQuestionsList] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingFaq) {
      setMode("edit");
      setQuestion(editingFaq.question);
      setAnswer(editingFaq.answer);
      if (editingFaq.topicId) setSelectedTopicId(editingFaq.topicId);
    } else {
      setMode("create");
    }
  }, [editingFaq]);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setQuestionsList([]);
    setSelectedTopicId("");
    setIsCreatingTopic(false);
    setNewTopicTitle("");
    setEditingFaq(null);
  };

  const handleAddToList = () => {
    if (!question.trim() || !answer.trim()) return;
    setQuestionsList((prev) => [...prev, { question: question.trim(), answer: answer.trim() }]);
    setQuestion("");
    setAnswer("");
  };

  const handleRemoveFromList = (index) => {
    setQuestionsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (mode === "edit") {
        await updateQuestion({
          id: editingFaq._id,
          question: question.trim(),
          answer: answer.trim(),
          topicId: selectedTopicId || editingFaq.topicId,
        }).unwrap();
        showToast("FAQ updated successfully!", "success");
      } else {
        if (questionsList.length === 0 && (!question.trim() || !answer.trim())) {
          showToast("Add at least one question", "warning");
          setLoading(false);
          return;
        }

        let topicId = selectedTopicId;

        if (isCreatingTopic && newTopicTitle.trim()) {
          const res = await createTopic({ title: newTopicTitle.trim(), role }).unwrap();
          topicId = res.data._id;
        }

        if (!topicId) {
          showToast("Please select or create a topic", "warning");
          setLoading(false);
          return;
        }

        const currentEntry = (question.trim() && answer.trim()) ? [{ question, answer }] : [];
        const questionsToSave = [...questionsList, ...currentEntry];

        await Promise.all(
          questionsToSave.map((q) =>
            createQuestion({
              topicId,
              question: q.question,
              answer: q.answer,
              role,
              isPublished: true,
            }).unwrap()
          )
        );
        showToast("FAQ(s) added successfully!", "success");
      }

      await refetch();
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Operation failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      {/* FIX APPLIED:
         1. h-[85vh] -> Sets a fixed height relative to viewport
         2. flex flex-col -> Enables stacking of Header/Body/Footer
         3. overflow-hidden -> Prevents double scrollbars
      */}
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0 rounded-xl overflow-hidden bg-white">

        {/* --- HEADER (Fixed) --- */}
        <DialogHeader className="p-6 bg-[#0c1f4d] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              {mode === "edit" ? <PenLine className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-wide text-white">
                {mode === "edit" ? "Edit FAQ" : "Add New FAQ"}
              </DialogTitle>
              <DialogDescription className="text-blue-100 mt-1">
                {mode === "edit"
                  ? "Modify the existing question and answer."
                  : `Create questions for the ${role} help center.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* --- SCROLLABLE BODY (Flexible) --- */}
        {/* FIX APPLIED: flex-1 takes remaining space, overflow-y-auto enables scrolling within this div only */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Topic Section */}
          {mode === "create" && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
              <div className="flex items-center gap-2 text-[#0c1f4d] font-semibold">
                <Layers className="w-4 h-4" />
                <span>Topic Category</span>
              </div>

              {!isCreatingTopic ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
                    <SelectTrigger className="flex-1 bg-white border-gray-200">
                      <SelectValue placeholder="Select an existing topic..." />
                    </SelectTrigger>
                    <SelectContent>
                      {topicOptions.map((t) => (
                        <SelectItem key={t._id} value={t._id}>{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingTopic(true)}
                    className="border-[#0c1f4d] text-[#0c1f4d] hover:bg-blue-50"
                  >
                    + Create New
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="Enter new topic title..."
                    className="flex-1 bg-white"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => { setIsCreatingTopic(false); setNewTopicTitle(""); }}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0c1f4d] font-semibold">
              <FileText className="w-4 h-4" />
              <span>Question Details</span>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-600 mb-1.5 block">Question</Label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., How do I reset my password?"
                  className="focus-visible:ring-[#0c1f4d] border-gray-300"
                />
              </div>
              <div>
                <Label className="text-gray-600 mb-1.5 block">Answer</Label>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={5}
                  placeholder="Provide a detailed answer..."
                  className="focus-visible:ring-[#0c1f4d] resize-none border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Add to List Button */}
          {mode === "create" && (
            <Button
              onClick={handleAddToList}
              disabled={!question.trim() || !answer.trim()}
              variant="outline"
              className="w-full border-dashed border-2 border-gray-300 hover:border-[#0c1f4d] hover:bg-blue-50 text-gray-500 hover:text-[#0c1f4d] transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Question to Queue
            </Button>
          )}

          {/* Queue Preview */}
          {mode === "create" && questionsList.length > 0 && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm font-semibold text-[#0c1f4d] mb-3 flex items-center justify-between">
                <span>Queued Questions ({questionsList.length})</span>
                <span className="text-xs font-normal text-gray-500">Ready to save</span>
              </p>
              <div className="space-y-2">
                {questionsList.map((q, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3 group">
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-gray-800">{q.question}</p>
                      <p className="text-gray-500 truncate mt-1">{q.answer}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveFromList(i)}
                      className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4 " />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- FOOTER (Fixed) --- */}
        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#0c1f4d] hover:bg-[#1a2f6d] text-white min-w-[140px]"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mode === "edit" ? "Update FAQ" : "Save All"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default FAQAdminDialog;
