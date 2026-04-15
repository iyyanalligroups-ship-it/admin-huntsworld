import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Package, Building2, ShoppingCart, MapPin, User, Briefcase, Mail, Phone, Building, Users, Calendar, Info, Tag, IndianRupee } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import gsap from 'gsap';
import ProductQuoteForm from './reusable/ProductQuoteForm';

const ProductAttributesPage = ({ data }) => {
    const product = data?.product;
    const productAttributes = data?.productAttributes;
    const seller = data?.seller;
    const address = data?.address;
    const user = data?.user;
    // Inside your component:
    const productRef = useRef(null);
    const companyRef = useRef(null);
    const [activeTab, setActiveTab] = useState('product');

    if (!product) return (
        <div className="flex items-center justify-center h-screen text-red-500">
            <p>No product data found</p>
        </div>
    );
    useEffect(() => {
        const tabContent = activeTab === "product" ? productRef.current : companyRef.current;

        gsap.fromTo(
            tabContent,
            { opacity: 0, y: 50, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }
        );
    }, [activeTab]);

    // Function to format key names (e.g., convert snake_case to Title Case)
    const formatKey = (key) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Function to determine if a key-value pair should be displayed
    const shouldDisplayKey = (key, value) => {
        // Ignore specific keys
        const ignoredKeys = ['updatedAt', 'createdAt', 'seller_id', '_id', '__v', 'company_logo', 'address_id', 'user_id'];
        if (ignoredKeys.includes(key)) return false;

        // Check for non-empty values
        if (value === null || value === undefined || value === '') return false;

        // Display simple types (string, number, boolean)
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return true;
        }
        // Handle specific nested objects
        if (key === 'category_id' && value?.category_name) return true;
        if (key === 'sub_category_id' && value?.sub_category_name) return true;
        if (key === 'price' && value?.$numberDecimal) return true;
        return false;
    };

    // Function to get displayable value
    const getDisplayValue = (key, value) => {
        if (key === 'price' && value?.$numberDecimal) {
            return `₹${value.$numberDecimal}`;
        }
        if (key === 'category_id' && value?.category_name) {
            return value.category_name;
        }
        if (key === 'sub_category_id' && value?.sub_category_name) {
            return value.sub_category_name;
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        return value;
    };

    // Function to get address as a single string
    const getFullAddress = (addressObj) => {
        if (!addressObj) return '';
        const addressFields = Object.entries(addressObj)
            .filter(([key, value]) =>
                typeof value === 'string' &&
                ['address_line_1', 'address_line_2', 'city', 'state', 'country', 'pincode'].includes(key) &&
                value !== ''
            )
            .map(([_, value]) => value)
            .filter(Boolean);
        return addressFields.join(', ');
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="flex gap-6">
                {/* Left Side: Tabs for Product and Company Details */}
                <div className="w-2/3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white rounded-lg shadow-sm">
                            <TabsTrigger
                                value="product"
                                className="cursor-pointer"
                            >
                                <Package className="w-5 h-5 text-[#0c1f4d]" /> Product Details
                            </TabsTrigger>
                            <TabsTrigger
                                value="company"
                                className="cursor-pointer"
                            >
                                <Building2 className="w-5 h-5 text-[#0c1f4d]" /> Company Details
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="product" ref={productRef}>
                            <Card className="mt-4 shadow-lg border-0">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <Package className="w-6 h-6 text-[#0c1f4d]" /> Product Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Name and Description (Full Width) */}
                                        {Object.entries(product).map(([key, value]) => (
                                            shouldDisplayKey(key, value) && (key === 'name' || key === 'description') && (
                                                <div
                                                    key={`${key}-${uuidv4()}`}
                                                    className="w-full p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {key === 'name' && <Package className="w-5 h-5 text-[#0c1f4d]" />}
                                                        {key === 'description' && <Info className="w-5 h-5 text-[#0c1f4d]" />}
                                                        <p className="text-sm font-semibold text-gray-700">{formatKey(key)}</p>
                                                    </div>
                                                    <p className={`text-sm text-gray-600 ${key === 'description' ? 'h-fit' : ''}`}>
                                                        {getDisplayValue(key, value)}
                                                    </p>
                                                </div>
                                            )
                                        ))}
                                        {/* Other Details (4-Column Grid) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {Object.entries(product).map(([key, value]) => (
                                                shouldDisplayKey(key, value) && key !== 'name' && key !== 'description' && (
                                                    <div
                                                        key={`${key}-${uuidv4()}`}
                                                        className="flex flex-col p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {key === 'price' && <IndianRupee className="w-4 h-4 text-[#0c1f4d]" />}
                                                            {key === 'category_id' && <Tag className="w-4 h-4 text-[#0c1f4d]" />}
                                                            {key === 'sub_category_id' && <Tag className="w-4 h-4 text-[#0c1f4d]" />}
                                                            <span className="font-semibold text-gray-700 text-sm">{formatKey(key)}</span>
                                                        </div>
                                                        <span className="text-gray-600 text-sm">{getDisplayValue(key, value)}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                        {/* Attributes (4-Column Grid) */}
                                        <h3 className="text-lg font-semibold mt-6 text-gray-800">Attributes</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                            {productAttributes?.map((attr, index) => (
                                                attr.attribute_value && (
                                                    <div
                                                        key={`${attr.attribute_key}-${index}`}
                                                        className="flex flex-col p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                                    >
                                                        <span className="font-semibold text-gray-700 text-sm mb-1">{attr.attribute_key}</span>
                                                        <span className="text-gray-600 text-sm">{attr.attribute_value}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="company" ref={companyRef}>
                            <Card className="mt-4 shadow-lg border-0">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <Building2 className="w-6 h-6 text-[#0c1f4d]" /> Company Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Company Name and Description (Full Width) */}
                                        {Object.entries(seller).map(([key, value]) => (
                                            shouldDisplayKey(key, value) && (key === 'company_name' || key === 'description') && (
                                                <div
                                                    key={`${key}-${uuidv4()}`}
                                                    className="w-full p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {key === 'company_name' && <Briefcase className="w-5 h-5 text-[#0c1f4d]" />}
                                                        {key === 'description' && <Info className="w-5 h-5 text-[#0c1f4d]" />}
                                                        <p className="text-sm font-semibold text-gray-700">{formatKey(key)}</p>
                                                    </div>
                                                    <p className={`text-sm text-gray-600 ${key === 'description' ? 'h-fit' : ''}`}>
                                                        {getDisplayValue(key, value)}
                                                    </p>
                                                </div>
                                            )
                                        ))}
                                        {/* Other Details (2-Column Grid) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(seller).map(([key, value]) => (
                                                shouldDisplayKey(key, value) && key !== 'company_name' && key !== 'description' && (
                                                    <div
                                                        key={`${key}-${uuidv4()}`}
                                                        className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex-shrink-0">
                                                            {key === 'company_email' && <Mail className="w-5 h-5 text-[#0c1f4d]" />}
                                                            {key === 'company_phone_number' && <Phone className="w-5 h-5 text-[#0c1f4d]" />}
                                                            {key === 'company_type' && <Building className="w-5 h-5 text-[#0c1f4d]" />}
                                                            {key === 'number_of_employees' && <Users className="w-5 h-5 text-[#0c1f4d]" />}
                                                            {key === 'year_of_establishment' && <Calendar className="w-5 h-5 text-[#0c1f4d]" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-700">{formatKey(key)}</p>
                                                            <p className="text-sm text-gray-600">{getDisplayValue(key, value)}</p>
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Side: Form and Seller Details */}
                <div className="w-1/3 flex flex-col gap-6 ">
                    {/* Form Section */}
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-[#0c1f4d]" /> Order Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="units" className="text-sm font-medium text-gray-700">Units</Label>
                                    <Input
                                        id="units"
                                        type="number"
                                        className="mt-1 rounded-md border-gray-200 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]"
                                        placeholder="Enter quantity"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="measurement" className="text-sm font-medium text-gray-700">Measurement</Label>
                                    <Input
                                        id="measurement"
                                        type="text"
                                        className="mt-1 rounded-md border-gray-200 focus:border-[#0c1f4d] focus:ring-[#0c1f4d]"
                                        placeholder="Enter measurement"
                                    />
                                </div>
                                <Button
                                    className="w-full bg-[#ea1a24] cursor-pointer hover:bg-[#f79494] text-white font-semibold py-2 rounded-md transition-colors"
                                >
                                    Submit
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <div className=''>
                        <ProductQuoteForm product={product} />
                    </div>
                    {/* Seller Details */}
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#0c1f4d]" /> Seller Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {user?.name && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <User className="w-5 h-5 text-[#0c1f4d]" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Name</p>
                                            <p className="text-sm text-gray-600">{user.name}</p>
                                        </div>
                                    </div>
                                )}
                                {seller?.company_name || seller?.travels_name && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <Briefcase className="w-5 h-5 text-[#0c1f4d]" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Company Name</p>
                                            <p className="text-sm text-gray-600">{seller.company_name || seller?.travels_name}</p>
                                        </div>
                                    </div>
                                )}
                                {address && getFullAddress(address) && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <MapPin className="w-5 h-5 text-[#0c1f4d]" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Address</p>
                                            <p className="text-sm text-gray-600">{getFullAddress(address)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>

        </div>
    );
};

export default ProductAttributesPage;