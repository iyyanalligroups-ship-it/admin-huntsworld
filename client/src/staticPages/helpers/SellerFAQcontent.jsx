import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, HelpCircle } from "lucide-react";

const FAQContent = ({ selectedTopic, faqs, onEdit, onDelete }) => {
  return (
    <div className="flex-1 h-full flex flex-col">
      {/* Header Section: Stacks on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-4 sm:pb-6 mb-2 border-b border-gray-100">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0c1f4d] tracking-tight">
          {selectedTopic}
        </h2>
        <span className="w-fit bg-blue-50 text-[#0c1f4d] border border-blue-100 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
          {faqs.length} {faqs.length === 1 ? 'Question' : 'Questions'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq._id}
              value={faq._id}
              className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pr-2 sm:pr-4">
                {/* The clickable Trigger */}
                <AccordionTrigger className="flex-1 px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg font-semibold text-slate-800 hover:text-[#0c1f4d] hover:no-underline text-left transition-colors">
                  <span className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-gray-300 mt-1 shrink-0 group-hover:text-[#0c1f4d] transition-colors" />
                    {faq.question}
                  </span>
                </AccordionTrigger>

                {/* Action Buttons */}
                {/* Mobile: Always visible, Row at bottom of trigger
                    Desktop: Hidden until hover, Row at right */}
                <div className="flex items-center justify-end gap-1 px-4 pb-3 sm:p-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-all sm:duration-200 sm:translate-x-4 sm:group-hover:translate-x-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:text-[#0c1f4d] hover:bg-blue-50 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(faq);
                    }}
                    title="Edit Question"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(faq._id);
                    }}
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 sm:pt-2">
                <div className="pl-8 text-sm sm:text-base leading-relaxed text-slate-600 border-l-2 border-gray-100 ml-1 sm:border-none sm:ml-0">
                  {faq.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQContent;
