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
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Plus, Loader2 } from "lucide-react";
// import { useGetFaqQuestionsForBuyerQuery } from "@/redux/api/FAQapi";
// import {
//   useGetFaqTopicsForQuestionsQuery,
//   useCreateFaqTopicMutation,
//   useCreateFaqQuestionMutation,
// } from "@/redux/api/FAQapi";

// const BuyerFAQ = () => {
//   // Add refetch function to the query
//   const {
//     data: response,
//     isLoading,
//     error,
//     refetch: refetchBuyerFAQs
//   } = useGetFaqQuestionsForBuyerQuery();

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
//   const [questionsList, setQuestionsList] = useState([]); // [{ question, answer }]

//   // Fetch topics from DB for dropdown
//   const { data: topicsData } = useGetFaqTopicsForQuestionsQuery({ type: "buyer" });
//   const topicOptions = topicsData?.data || [];

//   const [createTopic, { isLoading: creatingTopic }] = useCreateFaqTopicMutation();
//   const [createQuestion, { isLoading: creatingQuestion }] = useCreateFaqQuestionMutation();

//   useEffect(() => {
//     if (topics.length && !selectedTopic) {
//       setSelectedTopic(topics[0]);
//     }
//   }, [topics]);

//   const handleAddQuestion = () => {
//     if (!question.trim() || !answer.trim()) return;
//     setQuestionsList((prev) => [...prev, { question: question.trim(), answer: answer.trim() }]);
//     setQuestion("");
//     setAnswer("");
//   };

//   const handleSubmit = async () => {
//     if (questionsList.length === 0) return;

//     let topicId = selectedTopicId;

//     // Create new topic if user chose to add one
//     if (isCreatingTopic && newTopicTitle.trim()) {
//       try {
//         const res = await createTopic({
//           title: newTopicTitle.trim(),
//           role: "buyer",
//         }).unwrap();
//         topicId = res.data._id;

//         // If new topic was created, refetch topics to update dropdown
//         // (topicsData will automatically refetch due to RTK Query cache)
//       } catch (err) {
//         console.error("Failed to create topic:", err);
//         alert("Failed to create topic. Please try again.");
//         return;
//       }
//     }

//     if (!topicId) {
//       alert("Please select or create a topic");
//       return;
//     }

//     // Submit all questions
//     try {
//       await Promise.all(
//         questionsList.map((q) =>
//           createQuestion({
//             topicId,
//             question: q.question,
//             answer: q.answer,
//             role: "buyer",
//             isPublished: true,
//           }).unwrap()
//         )
//       );

//       // REFETCH DATA TO UPDATE UI IMMEDIATELY
//       await refetchBuyerFAQs();

//       // If we created a new topic, also refetch topics
//       // (This is handled automatically by RTK Query cache invalidation)

//       setOpen(false);
//       resetForm();



//     } catch (err) {
//       console.error("Failed to create questions:", err);
//       alert("Some questions failed to save. Please check and try again.");
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
//       refetchBuyerFAQs();
//     }
//   }, [selectedTopic, refetchBuyerFAQs]);

//   return (
//     <motion.div
//       className="relative lg:p-4 sm:p-6 md:p-10 min-h-screen bg-gray-50"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//     >
//       {/* Add FAQ Button - Top Right */}
//       <div className="absolute top-4 right-4 z-10">
//         <Dialog open={open} onOpenChange={setOpen}>
//           <DialogTrigger asChild>
//             <Button className="shadow-lg flex items-center gap-2 bg-[#0c1f4d] hover:bg-[#0c204df1]">
//               <Plus className="w-5 h-5" />
//               Add FAQ
//             </Button>
//           </DialogTrigger>

//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>Add New FAQ(s)</DialogTitle>
//             </DialogHeader>

//             {/* Topic Selection */}
//             <div className="space-y-4 mt-4">
//               {!isCreatingTopic ? (
//                 <div className="space-y-2">
//                   <Label>Select Topic</Label>
//                   <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Choose an existing topic" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {topicOptions.map((topic) => (
//                         <SelectItem key={topic._id} value={topic._id}>
//                           {topic.title}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <Button
//                     variant="link"
//                     className="text-blue-600 p-0 h-auto"
//                     onClick={() => setIsCreatingTopic(true)}
//                   >
//                     + Create New Topic
//                   </Button>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   <Label>New Topic Title</Label>
//                   <Input
//                     value={newTopicTitle}
//                     onChange={(e) => setNewTopicTitle(e.target.value)}
//                     placeholder="Enter topic title..."
//                     className="mt-1"
//                   />
//                   <Button
//                     variant="link"
//                     className="text-sm text-gray-500 p-0 h-auto mt-2"
//                     onClick={() => {
//                       setIsCreatingTopic(false);
//                       setNewTopicTitle("");
//                     }}
//                   >
//                     ← Back to existing topics
//                   </Button>
//                 </div>
//               )}
//             </div>

//             {/* Question + Answer Input */}
//             <div className="space-y-4 mt-6 border-t pt-6">
//               <h3 className="font-medium">Add Questions</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label>Question</Label>
//                   <Input
//                     value={question}
//                     onChange={(e) => setQuestion(e.target.value)}
//                     placeholder="Enter your question..."
//                   />
//                 </div>
//                 <div>
//                   <Label>Answer</Label>
//                   <Textarea
//                     value={answer}
//                     onChange={(e) => setAnswer(e.target.value)}
//                     placeholder="Enter the answer..."
//                     rows={3}
//                   />
//                 </div>
//               </div>
//               <Button
//                 onClick={handleAddQuestion}
//                 disabled={!question.trim() || !answer.trim()}
//                 variant="outline"
//                 className="w-full"
//               >
//                 + Add This Question
//               </Button>
//             </div>

//             {/* Added Questions Preview */}
//             {questionsList.length > 0 && (
//               <div className="mt-6 p-4 bg-gray-100 rounded-lg">
//                 <p className="font-medium mb-3">
//                   Will be added ({questionsList.length} question{questionsList.length > 1 ? "s" : ""}):
//                 </p>
//                 <ul className="space-y-2 text-sm">
//                   {questionsList.map((q, i) => (
//                     <li key={i} className="bg-white p-3 rounded shadow-sm">
//                       <strong>Q:</strong> {q.question}
//                       <br />
//                       <span className="text-gray-600"><strong>A:</strong> {q.answer}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Submit */}
//             <div className="flex justify-end gap-3 mt-6">
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
//               >
//                 {(creatingTopic || creatingQuestion) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                 Save All FAQs
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Mobile Dropdown */}
//       <motion.div
//         className="sm:hidden mb-4"
//         initial={{ y: -20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ duration: 0.4 }}
//       >
//         <Select value={selectedTopic} onValueChange={setSelectedTopic}>
//           <SelectTrigger className="w-full bg-white shadow-md p-3 rounded-md hover:shadow-lg transition-all">
//             <SelectValue placeholder="Select a topic" />
//           </SelectTrigger>
//           <SelectContent>
//             {topics.map((topic, index) => (
//               <SelectItem key={index} value={topic}>
//                 {topic}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </motion.div>

//       {/* Desktop Layout */}
//       <div className="flex flex-col sm:flex-row gap-6">
//         <motion.div
//           className="hidden sm:block w-64"
//           initial={{ x: -30, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ duration: 0.5 }}
//         >
//           <Sidebar topics={topics} selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic} />
//         </motion.div>

//         <motion.div
//           key={selectedTopic}
//           className="flex-1"
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//         >
//           {isLoading ? (
//             <div className="flex justify-center items-center py-12">
//               <div className="text-center">
//                 <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-2" />
//                 <p className="text-gray-500">Loading FAQs...</p>
//               </div>
//             </div>
//           ) : error ? (
//             <div className="text-center py-12">
//               <p className="text-red-500 mb-2">Failed to load FAQ content.</p>
//               <Button onClick={() => refetchBuyerFAQs()} variant="outline" size="sm">
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
//             <FAQContent selectedTopic={selectedTopic} faqs={faqData[selectedTopic]} />
//           )}
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// };

// export default BuyerFAQ;
import RoleBasedFAQ from "./helpers/RoleBasedFAQ";

export default function BuyerFAQ() {
  return <RoleBasedFAQ role="buyer" pageTitle="BUYER'S HELP CENTER" />;
}
