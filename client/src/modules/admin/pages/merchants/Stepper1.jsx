import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axios from "axios";

const Stepper1 = ({ formData, setFormData, error, setError, loading, setLoading, handleNext, handleCancel }) => {
  const [emailQuery, setEmailQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");

  // Validate search queries
  const getSearchParams = () => {
    if (!emailQuery.trim() && !phoneQuery.trim()) {
      setError("Please enter an email or phone number to search.");
      return null;
    }

    if (emailQuery.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailQuery.trim())) {
        setError("Please enter a valid email address.");
        return null;
      }
      return { email: emailQuery.trim() };
    }

    if (phoneQuery.trim()) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(phoneQuery.trim())) {
        setError("Please enter a valid phone number.");
        return null;
      }
      return { phone_number: phoneQuery.trim() };
    }

    return null;
  };

  const handleSearch = async () => {
    const params = getSearchParams();
    if (!params) return;

    setLoading(true);
    setError("");
    setFormData((prev) => ({ ...prev, isSearched: false }));

    try {
      // Construct API params
      console.log("Sending API request with params:", params);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/lookup`, { params });

      console.log("API response:", JSON.stringify(response.data, null, 2));

      // Check if response data is valid
      if (!response.data || !response.data.success || !Array.isArray(response.data.users)) {
        throw new Error("Invalid API response: no users found or incorrect format.");
      }

      // Get the first user from the response
      const user = response.data.users[0];

      // Validate required fields
      const missingFields = [];
      if (!user.user_id) missingFields.push("user_id");
      if (!user.name) missingFields.push("name");
      if (!user.phone_number) missingFields.push("phone_number");

      if (missingFields.length > 0) {
        console.warn("Missing fields in response:", missingFields);
        throw new Error(`Incomplete user data: missing ${missingFields.join(", ")}.`);
      }

      // Update formData with fetched data
      const updatedFormData = {
        ...formData,
        user_id: user.user_id,
        name: user.name,
        email: user.email || "",
        phone_number: user.phone_number,
        isSearched: true,
      };
      console.log("Updated formData:", updatedFormData);
      setFormData(updatedFormData);
    } catch (err) {
      console.error("API error:", err.message, err.response?.data);
      if (err.response?.status === 404 || err.message.includes("no users found")) {
        setError(`No user found with the provided ${params.email ? 'email' : 'phone'}.`);
      } else if (err.response?.status === 400) {
        setError(err.response.data.error || "Invalid search input.");
      } else if (err.message.includes("Incomplete user data")) {
        setError(err.message);
      } else if (err.message.includes("Invalid API response")) {
        setError("Invalid response from server. Please try again.");
      } else {
        setError("An error occurred while fetching user data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Search User</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Search by email..."
            value={emailQuery}
            onChange={(e) => {
              setEmailQuery(e.target.value);
              if (e.target.value) setPhoneQuery("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Input
            placeholder="Search by phone..."
            value={phoneQuery}
            onChange={(e) => {
              setPhoneQuery(e.target.value);
              if (e.target.value) setEmailQuery("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} className="w-full bg-[#0c1f4d] hover:bg-[#153171]">
          {loading ? "Searching..." : "Search User"}
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {formData.isSearched && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ""}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Name"

            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={formData.email || ""}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Email (optional)"
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number || ""}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Phone number"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-4">
        <Button variant="outline" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={() => handleNext()} disabled={loading || !formData.isSearched}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default Stepper1;