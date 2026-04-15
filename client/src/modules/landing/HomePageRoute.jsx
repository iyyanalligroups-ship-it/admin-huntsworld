import { Route } from "react-router-dom";
import HomeLayout from "./layout/HomeLayout";
import Register from "./pages/Register";
import Login from "./pages/Login";
import HomePage from "./HomePage";
import SellerFAQ from "../../staticPages/SellerFAQ";
import BuyerFAQ from "../../staticPages/BuyerFAQ";
import AllCountriesPage from "./pages/pages/categorySection/AllCountriesPage";
import AllCategoriesPage from "./pages/pages/categorySection/AllCategoriesPage";
import SubCategoryList from "./pages/pages/categorySection/SubCategoryList";
import ProductList from "./pages/pages/categorySection/ProductList";
import SubCategoryDetail from "./pages/pages/categorySection/SubCategoryDetailsPage";
import ProductListPage from "./pages/pages/categorySection/ProductsPages/ProductListPage";
import ProductDetailsPage from "./pages/pages/categorySection/ProductsPages/ProductDetailsPage";
import CompanyWebsite from "./pages/pages/categorySection/ProductsPages/CompanyWebsite";
import AboutUs from "@/staticPages/AboutUs";
import FeedBack from "@/staticPages/FeedBack";
import Testimonial from "@/staticPages/Testimonial";
import Disclaimer from "@/staticPages/Disclaimer";
import ComplaintForm from "@/staticPages/Complaint";
import ContactUs from "@/staticPages/ContactUs";
import PostRequirement from "@/staticPages/PostByRequirement";
import ReviewProduct from "@/modules/landing/pages/pages/categorySection/ProductsPages/ReviewProduct";
import Dashboard from "../student/pages/dashboard/Dashboard";
import FavoriteProduct from "../student/pages/favorite/FavoriteProduct";
import VerificationList from "../student/pages/verification/VerificationList";
import WalletPage from "../student/pages/wallet/Wallet";
import Settings from "../student/pages/settings/Settings";
import UserDashboard from "../commonUser/pages/dashboard/Dashboard";
import UserFavorite from "../commonUser/pages/favorite/favoriteProduct";
import UserSettings from "../commonUser/pages/settings/Settings";
import UserWallet from "../commonUser/pages/wallet/Wallet";
import LoginAs from "../commonUser/pages/Login-as/Login-as";
import PrivacyPolicy from "@/staticPages/PrivacyPolicy";
import TermsConditions from "@/staticPages/TermsConditions";
import AdvertiseWithUs from "@/staticPages/AdvertiseWithUs";


const HomePageRoute = (
  <Route path="/*" element={<HomeLayout />}>
    <Route index element={<HomePage />} />
    <Route path="home" element={<HomePage />} />
    <Route path="seller-faq" element={<SellerFAQ />} />
    <Route path="buyer-faq" element={<BuyerFAQ />} />
    <Route path="about" element={<AboutUs />} />
    <Route path="feedback" element={<FeedBack />} />

    <Route path="testimonials" element={<Testimonial />} />
    <Route path="disclaimer" element={<Disclaimer />} />
    <Route path="complaint" element={<ComplaintForm />} />
    <Route path="contact" element={<ContactUs />} />
    <Route path="privacy-policy" element={<PrivacyPolicy />} />
    <Route path="terms-condition" element={<TermsConditions />} />
    <Route path="advertise-with-us" element={<AdvertiseWithUs />} />

    <Route path="testimonials" element={< Testimonial />} />
    <Route path="disclaimer" element={< Disclaimer />} />
    <Route path="complaint" element={< ComplaintForm />} />
    <Route path="contact" element={< ContactUs />} />
    <Route path="post-requirement" element={<PostRequirement />} />
    <Route path="login" element={<Login />} />
    <Route path="register" element={<Register />} />
    <Route path="all-country" element={<AllCountriesPage />} />
    <Route path="all-categories" element={<AllCategoriesPage />} />
    <Route path="all-categories/:category" element={<SubCategoryList />} />
    <Route path="all-categories/:category/:subCategory" element={<SubCategoryList />} />
    <Route path="subcategory-detail/:subcategoryName" element={<SubCategoryDetail />} />
    <Route path="products/:type/:deepSubCategory" element={<ProductListPage />} />
    <Route path="product/:product_name" element={<ProductDetailsPage />} />
    <Route path="company/:company_name" element={<CompanyWebsite />} />
    <Route path="review/:productId" element={<ReviewProduct />} /> {/* Added ReviewProduct route */}

    {/* student routes */}
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="favorite" element={<FavoriteProduct />} />
    <Route path="verification-list" element={<VerificationList />} />
    <Route path="wallet" element={<WalletPage />} />
    <Route path="settings" element={<Settings />} />

    {/* common user routes */}
    <Route path="user-dashboard" element={<UserDashboard />} />
    <Route path="user-favorite" element={<UserFavorite />} />
    <Route path="user-wallet" element={<UserWallet />} />
    <Route path="user-settings" element={<UserSettings />} />
    <Route path="Login-as" element={<LoginAs/>} />
  </Route>
);

export default HomePageRoute;