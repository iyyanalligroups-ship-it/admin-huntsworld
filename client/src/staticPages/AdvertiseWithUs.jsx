import React, { useContext } from "react";
import { useGetPlansWithDetailsQuery } from "@/redux/api/SubcriptionPlanApi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LogIn,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

const AdvertiseWithUs = () => {
  const { data: plans, error, isLoading } = useGetPlansWithDetailsQuery();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleBuyPlan = (planId) => {
    if (!user?.user) {
      navigate("/login");
      return;
    }

    if (
      user?.user.role?.role === "MERCHANT" ||
      user?.role_id?.name === "SERVICE_PROVIDER"
    ) {
      if (user?.user?.role.role === "MERCHANT") {
        navigate("/merchant/plans/subscription");
      } else {
        navigate("/service-provider/plans/subscription");
      }
    } else if (
      user?.user?.role?.role === "STUDENT" ||
      user?.user?.role?.role === "USER" ||
      user?.user?.role?.role === "GROCERY_SELLER"
    ) {
      navigate("/register");
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0c1f4d]"></div>
      </div>
    );
  if (error)
    return (
      <div className="text-center py-10 text-red-600 font-semibold">
        Error loading plans: {error.message}
      </div>
    );

  return (
    <div className="container mx-auto py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
      {/* Main Title */}
      <div className="text-center mb-12 animate-fade-in">
        <h2 className="text-5xl font-extrabold text-[#0c1f4d] tracking-tight">
          Advertise With Us
        </h2>
        <p className="text-xl text-gray-600 mt-3 max-w-2xl mx-auto">
          Boost your business with our premium advertising solutions
        </p>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="flex justify-center mb-12 bg-transparent rounded-full p-1 border border-indigo-200 shadow-sm">
          <TabsTrigger
            value="membership"
            className="px-6 py-3 text-lg font-medium rounded-full transition-all duration-300 data-[state=active]:bg-[#0c1f4d] data-[state=active]:text-white hover:bg-indigo-100"
          >
            Membership Plan
          </TabsTrigger>
          <TabsTrigger
            value="banner"
            className="px-6 py-3 text-lg font-medium rounded-full transition-all duration-300 data-[state=active]:bg-[#0c1f4d] data-[state=active]:text-white hover:bg-indigo-100"
          >
            Banner Advertisement
          </TabsTrigger>
        </TabsList>

        {/* Membership Plans Tab */}
        <TabsContent value="membership" className="animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans?.data?.map((plan, index) => (
              <Card
                key={plan._id}
                className={`relative w-full rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden ${
                  index === 1 ? "border-2 border-[#0c1f4d] scale-105" : "border-gray-200"
                }`}
              >
                {index === 1 && (
                  <span className="absolute top-0 right-0 bg-[#0c1f4d] text-white text-sm font-semibold px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </span>
                )}
                <CardHeader className="text-center pb-0">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {plan.plan_name}
                  </CardTitle>
                  <CardDescription className="text-4xl font-extrabold text-[#0c1f4d] mt-2">
                    ₹{plan.price}
                    <span className="text-base font-normal text-gray-500"> / year</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-8 pt-4">
                  <ul className="space-y-4 text-gray-700">
                    {plan.elements?.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        {feature.value && feature.value.toLowerCase() !== "no" ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500 mr-3" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500 mr-3" />
                        )}
                        <span className="text-base">
                          <strong>{feature.element_name}:</strong> {feature.value || "N/A"}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-8 bg-[#0c1f4d] text-white hover:bg-[#0c1f4d] font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => handleBuyPlan(plan._id)}
                  >
                    Buy Plan
                    {user?.user ? (
                      user?.user?.role?.role === "MERCHANT" ||
                      user?.user?.role?.role === "SERVICE_PROVIDER" ? (
                        <ArrowRight className="ml-2 h-5 w-5" />
                      ) : (
                        <UserPlus className="ml-2 h-5 w-5" />
                      )
                    ) : (
                      <LogIn className="ml-2 h-5 w-5" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Banner Advertisement Tab */}
        <TabsContent value="banner" className="animate-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Side Text */}
            <div className="space-y-6">
              <h3 className="text-3xl font-extrabold text-gray-900">
                Drive <span className="text-[#0c1f4d]">Targeted Traffic</span> & Build
                Brand Awareness
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Reach your ideal audience with our high-impact banner ads designed to
                maximize engagement and conversions.
              </p>

              <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl text-base text-gray-700 space-y-3 shadow-sm">
                <p className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-[#0c1f4d] mr-2" />
                  Custom-designed banners tailored to your brand.
                </p>
                <p className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-[#0c1f4d] mr-2" />
                  Drive thousands of unique visitors to your website.
                </p>
                <p className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-[#0c1f4d] mr-2" />
                  Generate high-quality business leads monthly.
                </p>
                <p className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-[#0c1f4d] mr-2" />
                  Boost brand visibility with strategic ad placements.
                </p>
              </div>

              <Button
                className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => handleBuyPlan("banner")}
              >
                Inquire Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Right Side Carousel */}
            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Explore Banner Ad Placements
              </h4>
              <Carousel
                showArrows
                infiniteLoop
                autoPlay
                interval={3000}
                showThumbs={false}
                className="rounded-2xl shadow-lg overflow-hidden"
              >
                <div>
                  <img
                    src="https://static.exportersindia.com/ei_advertise_images/banner_position_02.jpg"
                    alt="Banner Position 1"
                    className="rounded-2xl object-cover"
                  />
                  <p className="legend bg-[#0c1f4d] text-white rounded-b-lg">
                    Banner Position 1
                  </p>
                </div>
                <div>
                  <img
                    src="https://static.exportersindia.com/ei_advertise_images/banner_position_01.jpg"
                    alt="Banner Position 2"
                    className="rounded-2xl object-cover"
                  />
                  <p className="legend bg-[#0c1f4d] text-white rounded-b-lg">
                    Banner Position 2
                  </p>
                </div>
                <div>
                  <img
                    src="https://static.exportersindia.com/ei_advertise_images/banner_position_04.jpg"
                    alt="Banner Position 3"
                    className="rounded-2xl object-cover"
                  />
                  <p className="legend bg-[#0c1f4d] text-white rounded-b-lg">
                    Banner Position 3
                  </p>
                </div>
              </Carousel>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvertiseWithUs;