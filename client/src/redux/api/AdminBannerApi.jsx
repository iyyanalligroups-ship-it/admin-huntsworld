
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const AdminBannerApi = createApi({
    reducerPath: "AdminBannerApi",
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        prepareHeaders: (headers) => {
            const token = sessionStorage.getItem("token");
            if (token) headers.set("Authorization", `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ["AdminBanner"],
    endpoints: (builder) => ({
        getAdminBanners: builder.query({
            query: ({ page = 1, limit = 10 }) =>
                `/admin-banner/all?page=${page}&limit=${limit}`,
            providesTags: ["AdminBanner"], // ✅ REQUIRED
        }),

        createAdminBanner: builder.mutation({
            query: (body) => ({
                url: "/admin-banner/create",
                method: "POST",
                body,
            }),
            invalidatesTags: ["AdminBanner"],
        }),

        updateAdminBanner: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/admin-banner/update/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["AdminBanner"],
        }),

        deleteAdminBanner: builder.mutation({
            query: (id) => ({
                url: `/admin-banner/delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AdminBanner"],
        }),
        toggleBannerStatus: builder.mutation({
            query: ({ id, is_active }) => ({
                url: `/admin-banner/status/${id}`,
                method: "PATCH",
                body: { is_active },
            }),
            invalidatesTags: ["AdminBanner"],
        }),

    }),
});

export const {
    useGetAdminBannersQuery,
    useCreateAdminBannerMutation,
    useUpdateAdminBannerMutation,
    useDeleteAdminBannerMutation,
    useToggleBannerStatusMutation,
} = AdminBannerApi;
