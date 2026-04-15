import MyProfile from "../pages/settings/pages/Profile";
import MyAddress from "../pages/settings/pages/Address/Address";
import Point from "../pages/settings/pages/point/Point";
import { User, MapPin,Target,Tag ,ShieldCheck,Eye ,Key  } from "lucide-react";
import Coupons from "../pages/settings/pages/coupans/Coupons";
import SocialMedia from "../pages/settings/pages/socialmedia/SocialMedia";
import AccessPage from "../pages/settings/pages/access/AccessPage";
import AccessRequestForm from "../pages/Edit-or-delete-access/AccessRequestForm";

const SettingsMenuItems = [
    {
      label: "My Profile",
      value: "profile",
      icon: User,
      component: <MyProfile />,
    },
    {
      label: "My Address",
      value: "address",
      icon: MapPin,
      component: <MyAddress />,
    },
    {
      label: "Point Page",
      value: "point",
      icon: Target,
      component: <Point />,
    },
    {
      label: "Coupon Page",  
      value: "coupon",       
      icon: Tag,           
      component: <Coupons />, 
    },
      {
      label: "Social Media",
      value: "social-media",
      icon: ShieldCheck,
      component: <SocialMedia />,
    },
    {
      label: "Access Page",  
      value: "access",        
      icon: Eye,         
      component: <AccessPage />, 
    },
    {
      label: "Request Access",  
      value: "editOrDelete",        
      icon: Key,         
      component: <AccessRequestForm />, 
    }
    

  ];

export default SettingsMenuItems;
