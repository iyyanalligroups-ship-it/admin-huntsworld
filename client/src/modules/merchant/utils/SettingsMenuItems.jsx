import MyProfile from "../pages/settings/profile/Profile";
import MyAddress from "../pages/settings/address/AddressList";
import { User, MapPin } from "lucide-react";

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
    }
  ];

export default SettingsMenuItems;
