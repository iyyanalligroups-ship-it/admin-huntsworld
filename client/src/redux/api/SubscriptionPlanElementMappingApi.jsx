import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SubscriptionPlanElementMappingApi = createApi({
  reducerPath: "subscriptionPlanElementMappingApi",
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

  // ✅ ADD tagTypes properly here
  tagTypes: [
    "SubscriptionPlanElements",
    "SubscriptionPlanElementMappings",
  ],

  endpoints: (builder) => ({

    getMappings: builder.query({
      query: () =>
        "/subscription-plans-elements-mapping/fetch-all-subscriptionplanelementmappings",
      providesTags: ["SubscriptionPlanElementMappings"],
    }),

    createMapping: builder.mutation({
      query: (data) => ({
        url: "/subscription-plans-elements-mapping/create-subscriptionplanelementmappings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SubscriptionPlanElementMappings"],
    }),

    updateMapping: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/subscription-plans-elements-mapping/update-subscriptionplanelementmappings/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["SubscriptionPlanElementMappings"],
    }),

    deleteMapping: builder.mutation({
      query: (data) => ({
        url: "/subscription-plans-elements-mapping/delete-subscriptionplanelementmappings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SubscriptionPlanElementMappings"],
    }),

    getSubscriptionPlan: builder.query({
      query: () =>
        "/subscription-plans/fetch-all-subscriptionplans-for-mapping",
      providesTags: ["SubscriptionPlanElementMappings"],
    }),

    // 🔥 THIS IS THE IMPORTANT FIX
    getSubscriptionPlanElement: builder.query({
      query: () =>
        "/subscription-plans-elements/fetch-all-subscriptionplanelements-for-mapping",
      providesTags: ["SubscriptionPlanElements"],   // ✅ FIXED
    }),

  }),
});

export const {
  useGetMappingsQuery,
  useGetSubscriptionPlanQuery,
  useGetSubscriptionPlanElementQuery,
  useCreateMappingMutation,
  useUpdateMappingMutation,
  useDeleteMappingMutation,
} = SubscriptionPlanElementMappingApi;
