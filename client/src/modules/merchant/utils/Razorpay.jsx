// // utils/loadRazorpay.js
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// export const loadRazorpayScript = () => {
//   return new Promise((resolve) => {
//     // Already loaded
//     if (window.Razorpay) {
//       resolve(true);
//       return;
//     }
//     // Existing script tag
//     const existingScript = document.querySelector(
//       'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
//     );
//     if (existingScript) {
//       existingScript.addEventListener("load", () => resolve(true));
//       existingScript.addEventListener("error", () => resolve(false));
//       return;
//     }
//     // Create new script
//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//     script.async = true;
//     script.onload = () => resolve(true);
//     script.onerror = () => resolve(false);
//     document.body.appendChild(script);
//   });
// };