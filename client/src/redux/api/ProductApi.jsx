import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ProductApi = createApi({
  reducerPath: "productApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Product", "Review"], // Added "Review" tag
  endpoints: (builder) => ({
    // GET Products (with pagination and search)
    getProducts: builder.query({
      query: ({ page = 1, limit = 10, filter = "", search = "", user_id }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
          filter,
          user_id,
        });
        return `/products/fetch-all-products?${params.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["Product"],
    }),
    getNotVerifiedProducts: builder.query({
      query: ({ page = 1, limit = 10, filter = "", search = "", user_id }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
          filter,
          user_id,
        });
        return `/products/fetch-all-not-verified-products?${params.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["Product"],
    }),
    getUserSellerProductsById: builder.query({
      query: ({ page = 1, limit = 10, filter = "", search = "", userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
          filter,
        });
        return `/products/fetch-all-products-for-seller-by-id/${userId}?${params.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["Product"],
    }),

    getAllProducts: builder.query({
      query: ({ skip = 0, limit = 10 }) =>
        `/products/show-in-product-wise?skip=${skip}&limit=${limit}`,
      providesTags: ["Product"],
    }),
    // POST Create Product
    createProduct: builder.mutation({
      query: (data) => ({
        url: "/products/create-products",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
    // PUT Update Product
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/update-products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
    // DELETE Product
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/delete-products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
    // GET Merchant by email or phone
    getMerchantByEmailOrPhone: builder.query({
      query: ({ email, phone, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({ page, limit });
        if (email) params.append("email", email);
        if (phone) params.append("phone", phone);
        return `/merchants/fetch-all-merchant-products?${params.toString()}`;
      },
      providesTags: ["Product"],
    }),
    // Category API
    getCategories: builder.query({
      query: () => "/categories/fetch-all-category-for-super-sub-category",
      providesTags: ["Product"],
    }),
    // Subcategory API
    getSubCategories: builder.query({
      query: (categoryId) =>
        `/sub-categories/fetch-all-sub-category-for-super-sub-category?category=${categoryId}`,
      providesTags: ["Product"],
    }),
    // Super Subcategory API
    getSuperSubCategories: builder.query({
      query: (subCategoryId) =>
        `/super-sub-categories/fetch-all-super-sub-category-deep-sub-category?subCategory=${subCategoryId}`,
      providesTags: ["Product"],
    }),
    // Deep Subcategory API
    getDeepSubCategories: builder.query({
      query: (superSubCategoryId) =>
        `/deep-sub-categories/fetch-all-deep-sub-category-for-product?superSubCategory=${superSubCategoryId}`,
      providesTags: ["Product"],
    }),
    // Get Product by Name
    getProductByName: builder.query({
      query: ({ product_name }) =>
        `/products/fetch-product-by-name/${product_name}`,
      providesTags: ["Product"],
    }),
    // POST Create Product Quote
    createProductQuote: builder.mutation({
      query: (quoteData) => ({
        url: "/products/create-products", // Note: This seems incorrect, likely should be a quote endpoint
        method: "POST",
        body: quoteData,
      }),
      invalidatesTags: ["Product"],
    }),
    // Review Endpoints
    // GET All Reviews for a Product
    getReviewsByProduct: builder.query({
      query: (productId) =>
        `/reviews/fetch-all-reviews-by-product/${productId}`,
      transformResponse: (response) => {
        const reviews = response || [];
        const totalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const averageRating =
          reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
        return { reviews, averageRating: parseFloat(averageRating) };
      },
      providesTags: ["Review"],
    }),
    // POST Create Review
    createReview: builder.mutation({
      query: ({ userId, productId, rating, comments }) => ({
        url: "/reviews/create-review",
        method: "POST",
        body: { userId, productId, rating, comments },
      }),
      invalidatesTags: ["Review"], // Invalidate to refetch reviews and update average rating
    }),
    // GET Review by ID
    getReviewById: builder.query({
      query: (id) => `/reviews/fetch-review-by-id/${id}`,
      providesTags: ["Review"],
    }),
    // PUT Update Review
    updateReview: builder.mutation({
      query: ({ id, rating, comments }) => ({
        url: `/reviews/update-review-by-id/${id}`,
        method: "PUT",
        body: { rating, comments },
      }),
      invalidatesTags: ["Review"],
    }),
    // DELETE Review
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/reviews/delete-review-by-id/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Review"],
    }),
    getMerchantByUserId: builder.query({
      query: (userId) => `/products/merchant-info-by-user-id/${userId}`, // ✅ Sends as query param
      providesTags: ["Product"],
    }),
    verifyProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}/verify`,
        method: "PUT",
      }),
      invalidatesTags: ["Product"],
    }),
    // In your productApi.js or api slice
    unverifyProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}/unverify`, // or /revoke-verification
        method: "PUT", // or 'PATCH'
      }),
      invalidatesTags: ["Product"], // Refetch product list
    }),
    markProductAsRead: builder.mutation({
      query: (id) => ({
        url: `/products/mark-read/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetNotVerifiedProductsQuery,
  useGetUserSellerProductsByIdQuery,
  useGetAllProductsQuery,
  useGetMerchantByUserIdQuery,
  useCreateProductMutation,
  useGetProductByNameQuery,
  useUpdateProductMutation,
  useCreateProductQuoteMutation,
  useDeleteProductMutation,
  useGetMerchantByEmailOrPhoneQuery,
  useLazyGetMerchantByEmailOrPhoneQuery,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetSuperSubCategoriesQuery,
  useGetDeepSubCategoriesQuery,
  useGetReviewsByProductQuery,
  useCreateReviewMutation,
  useGetReviewByIdQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useVerifyProductMutation,
  useUnverifyProductMutation,
  useMarkProductAsReadMutation
} = ProductApi;
