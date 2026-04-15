// // src/staticPages/SellerFAQ.jsx

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import Sidebar from "./helpers/SellerFAQsidebar";
// import FAQContent from "./helpers/SellerFAQcontent";

// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";

// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Plus, Loader2 } from "lucide-react";
// import showToast from "@/toast/showToast";

// // ALL IMPORTS FIXED
// import {
//   useGetFaqQuestionsForSellerQuery,
//   useGetFaqTopicsForQuestionsQuery,
//   useCreateFaqTopicMutation,
//   useCreateFaqQuestionMutation,
// } from "@/redux/api/FAQapi";

// const SellerFAQ = () => {
//   // Add refetch function to the query
//   const {
//     data: response,
//     isLoading,
//     error,
//     refetch: refetchSellerFAQs
//   } = useGetFaqQuestionsForSellerQuery();

//   const faqData = response?.data || {};
//   const topics = Object.keys(faqData);
//   const [selectedTopic, setSelectedTopic] = useState("");

//   // Dialog state
//   const [open, setOpen] = useState(false);
//   const [isCreatingTopic, setIsCreatingTopic] = useState(false);
//   const [newTopicTitle, setNewTopicTitle] = useState("");
//   const [selectedTopicId, setSelectedTopicId] = useState("");
//   const [question, setQuestion] = useState("");
//   const [answer, setAnswer] = useState("");
//   const [questionsList, setQuestionsList] = useState([]);

//   // Fetch topics for dropdown
//   const { data: topicsData } = useGetFaqTopicsForQuestionsQuery({ type: "seller" });
//   const topicOptions = topicsData?.data || [];

//   const [createTopic, { isLoading: creatingTopic }] = useCreateFaqTopicMutation();
//   const [createQuestion, { isLoading: creatingQuestion }] = useCreateFaqQuestionMutation();

//   useEffect(() => {
//     if (topics.length > 0 && !selectedTopic) {
//       setSelectedTopic(topics[0]);
//     }
//   }, [topics]);

//   const handleAddQuestion = () => {
//     if (!question.trim() || !answer.trim()) return;
//     setQuestionsList(prev => [...prev, { question: question.trim(), answer: answer.trim() }]);
//     setQuestion("");
//     setAnswer("");
//   };

//   const handleSubmit = async () => {
//     if (questionsList.length === 0) return;

//     let topicId = selectedTopicId;

//     // Create new topic?
//     if (isCreatingTopic && newTopicTitle.trim()) {
//       try {
//         const res = await createTopic({
//           title: newTopicTitle.trim(),
//           role: "seller",
//         }).unwrap();
//         topicId = res.data._id;
//       } catch (err) {
//         showToast("Failed to create topic",'error');
//         return;
//       }
//     }

//     if (!topicId) {
//       showToast("Please select or create a topic",'error');
//       return;
//     }

//     try {
//       await Promise.all(
//         questionsList.map(q =>
//           createQuestion({
//             topicId,
//             question: q.question,
//             answer: q.answer,
//             role: "seller",
//             isPublished: true,
//           }).unwrap()
//         )
//       );

//       // REFETCH DATA TO UPDATE UI IMMEDIATELY
//       await refetchSellerFAQs();

//       // Success → close dialog & reset
//       setOpen(false);
//       resetForm();


//     } catch (err) {
//       showToast("Some questions could not be saved",'info');
//     }
//   };

//   const resetForm = () => {
//     setIsCreatingTopic(false);
//     setNewTopicTitle("");
//     setSelectedTopicId("");
//     setQuestion("");
//     setAnswer("");
//     setQuestionsList([]);
//   };

//   // Handle topic selection change - refetch if needed
//   useEffect(() => {
//     if (selectedTopic) {
//       // Ensure we have the latest data for the selected topic
//       refetchSellerFAQs();
//     }
//   }, [selectedTopic, refetchSellerFAQs]);

//   return (
//     <motion.div className="relative min-h-screen bg-gray-50 p-4 sm:p-6 md:p-10">
//       {/* ADD FAQ BUTTON – TOP RIGHT */}
//       <div className="absolute top-5 right-5 z-50">
//         <Dialog open={open} onOpenChange={setOpen}>
//           <DialogTrigger asChild>
//             <Button className="shadow-2xl flex items-center gap-2 bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white font-bold py-3 px-6 rounded-lg">
//               <Plus className="w-5 h-5" />
//               Add FAQ
//             </Button>
//           </DialogTrigger>

//           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle className="text-2xl font-bold">Add New Seller FAQ(s)</DialogTitle>
//             </DialogHeader>

//             {/* Topic Selection */}
//             <div className="mt-6 space-y-5">
//               {!isCreatingTopic ? (
//                 <>
//                   <Label className="text-base">Select Existing Topic</Label>
//                   <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Choose topic" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {topicOptions.map(topic => (
//                         <SelectItem key={topic._id} value={topic._id}>
//                           {topic.title}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <Button
//                     variant="link"
//                     className="text-green-600 p-0"
//                     onClick={() => setIsCreatingTopic(true)}
//                   >
//                     + Create New Topic
//                   </Button>
//                 </>
//               ) : (
//                 <>
//                   <Label>New Topic Title</Label>
//                   <Input
//                     value={newTopicTitle}
//                     onChange={e => setNewTopicTitle(e.target.value)}
//                     placeholder="Enter topic title..."
//                   />
//                   <Button
//                     variant="link"
//                     className="text-sm text-gray-500"
//                     onClick={() => {
//                       setIsCreatingTopic(false);
//                       setNewTopicTitle("");
//                     }}
//                   >
//                     Back to existing topics
//                   </Button>
//                 </>
//               )}
//             </div>

//             {/* Question & Answer */}
//             <div className="mt-8 border-t pt-8 space-y-6">
//               <h3 className="text-lg font-semibold">Question & Answer</h3>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <div>
//                   <Label>Question</Label>
//                   <Input
//                     value={question}
//                     onChange={e => setQuestion(e.target.value)}
//                     placeholder="Enter your question..."
//                   />
//                 </div>
//                 <div>
//                   <Label>Answer</Label>
//                   <Textarea
//                     value={answer}
//                     onChange={e => setAnswer(e.target.value)}
//                     placeholder="Enter the answer..."
//                     rows={5}
//                   />
//                 </div>
//               </div>

//               <Button
//                 onClick={handleAddQuestion}
//                 disabled={!question.trim() || !answer.trim()}
//                 variant="outline"
//                 className="w-full"
//               >
//                 + Add to List
//               </Button>
//             </div>

//             {/* Preview List */}
//             {questionsList.length > 0 && (
//               <div className="mt-6 p-5 bg-green-50 rounded-lg border">
//                 <p className="font-bold text-green-800 mb-4">
//                   {questionsList.length} FAQ{questionsList.length > 1 ? "s" : ""} ready
//                 </p>
//                 <div className="space-y-3">
//                   {questionsList.map((q, i) => (
//                     <div key={i} className="bg-white p-4 rounded border">
//                       <p className="font-medium">Q: {q.question}</p>
//                       <p className="text-gray-700">A: {q.answer}</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Buttons */}
//             <div className="flex justify-end gap-4 mt-8">
//               <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleSubmit}
//                 disabled={
//                   creatingTopic ||
//                   creatingQuestion ||
//                   questionsList.length === 0 ||
//                   (!selectedTopicId && !isCreatingTopic) ||
//                   (isCreatingTopic && !newTopicTitle.trim())
//                 }
//                 className="bg-green-600 hover:bg-green-700"
//               >
//                 {(creatingTopic || creatingQuestion) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                 Save All FAQs
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Rest of your layout (mobile dropdown + sidebar + content) */}
//       <motion.div className="sm:hidden mb-6">
//         <Select value={selectedTopic} onValueChange={setSelectedTopic}>
//           <SelectTrigger className="w-full">
//             <SelectValue placeholder="Select topic" />
//           </SelectTrigger>
//           <SelectContent>
//             {topics.map(t => (
//               <SelectItem key={t} value={t}>{t}</SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </motion.div>

//       <div className="flex flex-col sm:flex-row gap-8">
//         <motion.div className="hidden sm:block w-64">
//           <Sidebar topics={topics} selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic} />
//         </motion.div>

//         <motion.div key={selectedTopic} className="flex-1">
//           {isLoading ? (
//             <div className="flex justify-center items-center py-12">
//               <div className="text-center">
//                 <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600 mb-2" />
//                 <p className="text-gray-500">Loading...</p>
//               </div>
//             </div>
//           ) : error ? (
//             <div className="text-center py-12">
//               <p className="text-red-600 mb-2">Error loading FAQs</p>
//               <Button onClick={() => refetchSellerFAQs()} variant="outline" size="sm">
//                 Retry
//               </Button>
//             </div>
//           ) : topics.length === 0 ? (
//             <div className="text-center py-12">
//               <p className="text-gray-500 mb-4">No FAQ topics available.</p>
//               <p className="text-sm text-gray-400">Create your first FAQ using the button above.</p>
//             </div>
//           ) : !faqData[selectedTopic] ? (
//             <div className="text-center py-12">
//               <p className="text-gray-500">No questions available for this topic.</p>
//             </div>
//           ) : (
//             <FAQContent selectedTopic={selectedTopic} faqs={faqData[selectedTopic] || []} />
//           )}
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// };

// export default SellerFAQ;


import RoleBasedFAQ from "./helpers/RoleBasedFAQ";

export default function SellerFAQ() {
  return <RoleBasedFAQ role="seller" pageTitle="SELLER'S HELP CENTER" />;
}
