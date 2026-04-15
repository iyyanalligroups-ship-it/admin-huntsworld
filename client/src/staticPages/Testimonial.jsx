import {useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, Play, Pause, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import YouTube from "react-youtube";

const faqs = [
  {
    question: "What is the purpose of a testimonial?",
    answer: "A testimonial provides social proof and builds credibility for a product or service by sharing real user experiences."
  },
  {
    question: "Why are testimonials so powerful?",
    answer: "They showcase authentic feedback, influencing potential customers' buying decisions through trust and relatability."
  },
  {
    question: "What is the impact of testimonials?",
    answer: "Testimonials enhance brand reputation, increase conversion rates, and build stronger customer relationships."
  },
  {
    question: "How is a video testimonial helpful to a customer?",
    answer: "Video testimonials provide a more engaging, trustworthy, and relatable experience compared to written reviews."
  },
  {
    question: "Why do many people trust testimonials?",
    answer: "People trust testimonials because they reflect real experiences from other users, reducing skepticism about a service."
  }
];

const testimonials = [
  {
    id: 1,
    name: "Sriram V",
    company: "Essar Technologies",
    country: "India",
    review: "I personally find this platform very useful in connecting with buyers across the globe.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    id: 2,
    name: "Devesh Singh",
    company: "Vintage Vision Private Limited",
    country: "India",
    review: "If you're a business looking to optimize your B2B business and establish fruitful relationships with customers then exportersindia could be the right choice for you.",
    rating: 3.5,
    image: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    id: 3,
    name: "Mr. Swapnil Mittal",
    company: "Azure International",
    country: "India",
    review: "Thanks for completing the website development. I would like to complement your entire team for the amazing work.",
    rating: 5,
    image: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    id: 4,
    name: "Mr. Amran Bin Yardin",
    company: "Rad Winnners & Shb Chemicals Sdn Bhd",
    country: "Malaysia",
    review: "Your services are well appreciated by us. We shall continue to work with you for a long-term deal.",
    rating: 4.5,
    image: "https://randomuser.me/api/portraits/men/4.jpg",
  },
  {
    id: 5,
    name: "Ravi Kumar",
    company: "Tech Innovators",
    country: "USA",
    review: "Excellent platform for business networking and growth. Great support team!",
    rating: 4,
    image: "https://randomuser.me/api/portraits/men/5.jpg",
  },
  {
    id: 6,
    name: "Sophia Lee",
    company: "Global Trade Hub",
    country: "UK",
    review: "The best marketplace to connect with global clients. Super helpful team!",
    rating: 4.7,
    image: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    id: 7,
    name: "Daniel Smith",
    company: "Tech Solutions",
    country: "Canada",
    review: "Great experience with their B2B services. Helped me scale my business efficiently.",
    rating: 4.2,
    image: "https://randomuser.me/api/portraits/men/6.jpg",
  },
  {
    id: 8,
    name: "Elena Costa",
    company: "Trade Connect",
    country: "Italy",
    review: "Their platform made international trade much easier for my company.",
    rating: 4.8,
    image: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    id: 9,
    name: "Chris Walker",
    company: "Innovative Exports",
    country: "Australia",
    review: "Loved their platform and customer support. Truly a great business solution!",
    rating: 4.3,
    image: "https://randomuser.me/api/portraits/men/7.jpg",
  },
  {
    id: 10,
    name: "Emma Brown",
    company: "B2B Leaders",
    country: "Germany",
    review: "Highly professional and well-structured platform for business networking.",
    rating: 4.6,
    image: "https://randomuser.me/api/portraits/women/3.jpg",
  },
];

const testimonialsVideo = [
  {
    id: 1,
    name: "Sriram V",
    company: "Essar Technologies",
    country: "India",
    youtubeId: "dQw4w9WgXcQ",
  },
  {
    id: 2,
    name: "Devesh Singh",
    company: "Vintage Vision Pvt Ltd",
    country: "India",
    youtubeId: "tgbNymZ7vqY",
  },
  {
    id: 3,
    name: "Swapnil Mittal",
    company: "Azure International",
    country: "India",
    youtubeId: "3JZ_D3ELwOQ",
  },
  {
    id: 4,
    name: "Amran Bin Yardin",
    company: "Rad Winnners & Shb Chemicals Sdn Bhd",
    country: "Malaysia",
    youtubeId: "kJQP7kiw5Fk",
  },
];

const TestimonialForm = () => {
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
        },
        body: JSON.stringify({ description }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Testimonial submitted successfully!');
        setDescription('');
      } else {
        setMessage(result.message || 'Error submitting testimonial');
      }
    } catch (error) {
      setMessage('Error submitting testimonial');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Write a Review</h3>
      {message && (
        <div className={`mb-4 p-2 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Your Testimonial
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows="4"
            placeholder="Write your testimonial here..."
            required
          ></textarea>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit Testimonial'}
        </Button>
      </div>
    </div>
  );
};

function Testimonial() {
  const [visible, setVisible] = useState(5);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const onPlay = (videoId) => {
    setPlayingVideo(videoId);
  };

  const onPause = () => {
    setPlayingVideo(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-center">
          Client Reviews & Testimonials
        </h2>
        <Button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#e03733] hover:shadow-lg text-white py-2 px-4 rounded-md"
        >
          {isFormOpen ? 'Close Form' : 'Write a Review'}
        </Button>
      </div>
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <TestimonialForm />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.slice(0, visible).map((t) => (
          <Card
            key={t.id}
            className="p-4 rounded-xl shadow-md border border-gray-200 transition-all duration-300 
            hover:scale-105 hover:shadow-xl hover:border-transparent 
            hover:bg-gradient-to-r from-purple-500 to-pink-500 hover:text-white"
          >
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <p className="text-sm text-gray-500">
                    {t.company} - <i>{t.country}</i>
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-700">{t.review}</p>
              <div className="flex items-center mt-2">
                {[...Array(Math.floor(t.rating))].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                  />
                ))}
                {t.rating % 1 !== 0 && (
                  <Star
                    className="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                    opacity={0.5}
                  />
                )}
                <span className="ml-2 text-sm font-semibold">
                  {t.rating} / 5
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {visible < testimonials.length && (
        <div className="text-center mt-6">
          <Button
            onClick={() => setVisible(visible + 5)}
            className="bg-[#e03733] hover:shadow-lg text-white py-2 rounded-md cursor-pointer"
          >
            Load More
          </Button>
        </div>
      )}
      <div className="w-full max-w-6xl mx-auto py-10 px-4 bg-gray-100 mt-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          🎬 Customer Video Testimonials
        </h2>
        <Carousel className="relative">
          <CarouselContent className="flex gap-6">
            {testimonialsVideo.map((t) => (
              <CarouselItem
                key={t.id}
                className="basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <Card className="overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-2xl transition-all">
                  <CardContent className="relative">
                    <div className="w-full h-64 bg-black">
                      <YouTube
                        videoId={t.youtubeId}
                        opts={{
                          width: "100%",
                          height: "100%",
                          playerVars: {
                            autoplay: 0,
                            modestbranding: 1,
                            rel: 0,
                          },
                        }}
                        onPlay={() => onPlay(t.youtubeId)}
                        onPause={onPause}
                        className="w-full h-full rounded-t-xl"
                      />
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-300 hover:bg-gray-400" />
          <CarouselNext className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-300 hover:bg-gray-400" />
        </Carousel>
      </div>
      <div className="max-w-2xl mx-auto py-10 mt-10">
        <h2 className="text-center text-3xl font-bold mb-6">Why Client Testimonials Are Important?</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="mb-2 border-b rounded-lg overflow-hidden shadow-sm">
              <AccordionTrigger className="flex justify-between items-center p-4 bg-white hover:bg-gray-100 text-left font-semibold text-lg">
                Q{index + 1}. {faq.question}
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-gray-50">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

export default Testimonial;