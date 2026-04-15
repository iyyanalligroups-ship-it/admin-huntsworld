import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion } from "framer-motion";
import axios from "axios";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import showToast from "@/toast/showToast";


const categories = ["General Feedback", "Support Request", "Feature Request", "Bug Report", "Business Inquiry", "Other"];


const FeedBack = () => {
  const [formData, setFormData] = useState({
    category: "",
    message: "",
    email: "",
    company: "",
    name: "",
    country: "",
    phoneCode: "",
    phone: "",
    city: "",
  });
  const [countries, setCountries] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get("https://restcountries.com/v3.1/all").then((res) => {
      const countryData = res.data.map((c) => ({
        name: c.name.common,
        code: c.idd.root ? `${c.idd.root}${c.idd.suffixes ? c.idd.suffixes[0] : ""}` : "N/A",
      }));
      setCountries(countryData.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCountryChange = (value) => {
    const selectedCountry = countries.find((c) => c.name === value);
    setFormData({ ...formData, country: value, phoneCode: selectedCountry?.code || "" });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.message || formData.message.length < 50) newErrors.message = "Message must be at least 50 characters";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone || !formData.phoneCode) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneNumber = parsePhoneNumberFromString(formData.phoneCode + formData.phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        newErrors.phone = "Invalid phone number for selected country";
      }
    }

    if (!formData.city) newErrors.city = "City is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Form submitted:", formData);
      showToast("Feedback submitted successfully!",'success');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg m-6">
      <h2 className="text-2xl font-bold text-center mb-4"><span className="text-[#e03733]">Merchant Expo</span> Feedback Form</h2>
      <p className="text-center text-gray-600 mb-6">Your feedback helps us improve our platform.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Dropdown */}
        <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat, index) => (
              <SelectItem key={index} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}

        {/* Message */}
        <Textarea name="message" placeholder="Write your feedback..." className="w-full" onChange={handleInputChange} />
        {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}

        {/* Email & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input name="email" placeholder="Email *" onChange={handleInputChange} />
          <Input name="name" placeholder="Full Name *" onChange={handleInputChange} />
        </div>
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        {/* Company & Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input name="company" placeholder="Company Name (Optional)" onChange={handleInputChange} />
          <Select onValueChange={handleCountryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c, index) => (
                <SelectItem key={index} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phone & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gray-200 rounded">{formData.phoneCode}</span>
            <Input name="phone" placeholder="Mobile Number *" onChange={handleInputChange} />
          </div>
          <Input name="city" placeholder="City *" onChange={handleInputChange} />
        </div>
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
        {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}

        {/* Submit Button */}
        <Button type="submit" className="w-full bg-[#e03733]  hover:shadow-lg text-white py-2 rounded-md cursor-pointer">Submit</Button>
      </form>
    </motion.div>
  );
};

export default FeedBack;
