import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Send } from "lucide-react";
import { useState, useContext } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useAddQuoteMutation } from "@/redux/api/ProductQuoteApi";
import "../../../../../css/ProductQuoteModel.css";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";

const ProductQuoteModel = ({ product, open, setOpen }) => {
    const { user } = useContext(AuthContext);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [quantity, setQuantity] = useState("");
    const [quantityError, setQuantityError] = useState("");
    const [matchQuotes, setMatchQuotes] = useState(true);
    const [customUnit, setCustomUnit] = useState("");

    const [postQuote, { isLoading, error, isSuccess }] = useAddQuoteMutation();

    const handlePhoneChange = (value) => {
        setPhoneNumber(value);
        if (value && !isValidPhoneNumber(value)) {
            setPhoneError("Invalid phone number");
        } else {
            setPhoneError("");
        }
    };


    const isFormValid = quantity && !quantityError && phoneNumber && !phoneError;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) {
            showToast("Please fix the errors in the form.",'error');
            return;
        }

        try {
            const quoteData = {
                userId: user?.user?._id,
                productId: product._id,
                quantity,
                unit: product.unit || customUnit,
                phoneNumber,
                matchQuotes,
            };
            console.log(quoteData);

          const res=  await postQuote(quoteData).unwrap();

           console.log(res,'res');

            setOpen(false);
        } catch (err) {
            console.error("Failed to submit quote:", err);
            showToast("Failed to submit quote. Please try again.",'error');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild></DialogTrigger>

            <DialogContent className="max-w-6xl w-full p-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800">
                        Request a Quote
                    </DialogTitle>
                    <DialogClose />
                </DialogHeader>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Section - Product Info */}
                    {/* <div className="flex-1 space-y-6">
                        <div className="relative border rounded-lg overflow-hidden shadow-md">
                            <img
                                src={product.product_image[activeImageIndex]}
                                alt={product.product_name}
                                className="w-full h-20 object-contain bg-gray-50"
                            />
                            {product.product_image.length > 1 && (
                                <div className="flex justify-center mt-3 gap-3">
                                    {product.product_image.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`thumb-${index}`}
                                            className={`w-16 h-16 rounded-md object-cover cursor-pointer border-2 transition-all duration-200 ${activeImageIndex === index
                                                ? "border-[#0c1f4d] shadow-md"
                                                : "border-gray-200 opacity-70 hover:opacity-100"
                                                }`}
                                            onClick={() => setActiveImageIndex(index)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-gray-900">{product.product_name}</h2>
                            <p className="text-gray-600">{product.address}</p>
                            <p className="text-gray-500">
                                by <span className="text-blue-600 font-medium">{product.company_name}</span>
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                                Price: ₹{product.price.$numberDecimal} / {product.unit}
                            </p>
                            <p className="text-gray-600">MOQ: {product.moq} {product.unit}</p>
                            <p className="text-gray-500">Business Type: {product.business_type}</p>
                        </div>
                    </div> */}

                    {/* Right Section - Form */}
                    <div className="flex-1">
                        <Card className="shadow-lg border border-gray-100 rounded-xl">
                            <CardContent className="space-y-6 py-8">
                                <h3 className="text-lg font-semibold text-gray-800">Get Your Quote</h3>

                                {/* Quantity + Unit */}
                                {/* Quantity + Unit */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity & Unit
                                    </label>
                                    <div className="flex gap-3">
                                        <Input
                                            type="number"
                                            placeholder="Enter quantity"
                                            className="flex-1 rounded-md border-gray-300 focus:ring-[#0c1f4d] focus:border-[#0c1f4d]"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                        />
                                        {product.unit ? (
                                            <Input
                                                value={product.unit}
                                                placeholder="Unit"
                                                className="w-32 rounded-md border-gray-300 bg-gray-50"
                                                readOnly
                                            />
                                        ) : (
                                            <Input
                                                value={customUnit}
                                                onChange={(e) => setCustomUnit(e.target.value)}
                                                placeholder="Unit"
                                                className="w-32 rounded-md border-gray-300"
                                            />
                                        )}
                                    </div>
                                </div>


                                {/* Mobile Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                                    <PhoneInput
                                        placeholder="Enter phone number"
                                        defaultCountry="IN"
                                        value={phoneNumber}
                                        onChange={handlePhoneChange}
                                        className="custom-phone-input w-full border-2 rounded-md p-3"
                                        international
                                        countryCallingCodeEditable={false}
                                        addInternationalOption={false}
                                    />
                                    {phoneError && <p className="text-[#0c1f4d] text-sm mt-2">{phoneError}</p>}
                                </div>

                                {/* Checkbox */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="matchQuotes"
                                        checked={matchQuotes}
                                        onChange={(e) => setMatchQuotes(e.target.checked)}
                                        className="h-4 w-4 text-[#0c1f4d] focus:ring-[#0c1f4d] border-gray-300 rounded"
                                    />
                                    <label htmlFor="matchQuotes" className="text-sm text-gray-600">
                                        Include quotes from matching suppliers
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    className={`${isFormValid ? 'cursor-pointer' : 'cursor-not-allowed'} w-full bg-[#ea1a24] hover:bg-[#ea1a24] text-white font-medium rounded-md py-3 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                                    onClick={handleSubmit}
                                    disabled={!isFormValid || isLoading}
                                >
                                    {isLoading ? (
                                        "Submitting..."
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" /> Submit Quote
                                        </>
                                    )}
                                </Button>

                                {error && (
                                    <p className="text-red-500 text-sm text-center">
                                        Error: {error.data?.message || "Something went wrong"}
                                    </p>
                                )}
                                {isSuccess && (
                                    <p className="text-green-500 text-sm text-center">
                                        Quote submitted successfully!
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductQuoteModel;
