import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const AdminBannerImageApi = createApi({
  reducerPath: "AQdminBannerImageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_IMAGE_URL, // 👈 image server URL
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["BannerImage"],
  endpoints: (builder) => ({
    // 📤 UPLOAD
    uploadBannerImages: builder.mutation({
      query: (files) => {
        const formData = new FormData();
        files.forEach((file) =>
          formData.append("banner_images", file)
        );

        return {
          url: "/admin-banner-image/upload",
          method: "POST",
          body: formData,
        };
      },
    }),

    // ❌ DELETE
    deleteBannerImages: builder.mutation({
      query: (image_urls) => ({
        url: "/admin-banner-image/delete",
        method: "DELETE",
        body: { image_urls },
      }),
    }),
  }),
});

export const {
  useUploadBannerImagesMutation,
  useDeleteBannerImagesMutation,
} = AdminBannerImageApi;
