// src/redux/api/complaintNotificationApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ComplaintNotificationApi = createApi({
  reducerPath: "complaintNotificationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: "include",
  }),
  tagTypes: ["ComplaintNotification"],
  endpoints: (builder) => ({
    getComplaintNotifications: builder.query({
      query: ({ userId, page = 1, limit = 10, status = "all" }) =>
        `/complaint-form/notifications?userId=${userId}&page=${page}&limit=${limit}&status=${status}`,
      providesTags: ["ComplaintNotification"],
    }),
    getComplaintNotificationDetails: builder.query({
      query: (id) => `/complaint-form/notifications/${id}`,
      providesTags: ["ComplaintNotification"],
    }),
      deleteComplaintNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/complaint-form/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ComplaintNotification"],
    }),

    markComplaintAsRead: builder.mutation({
      query: ({ notificationId, userId }) => ({
        url: `/complaint-form/notifications/${notificationId}/read`,
        method: "PATCH",
        body: { userId },
      }),
      invalidatesTags: ["ComplaintNotification"],
    }),
  }),
});

export const {
  useGetComplaintNotificationsQuery,
  useGetComplaintNotificationDetailsQuery,
  useMarkComplaintAsReadMutation,
  useDeleteComplaintNotificationMutation,
} = ComplaintNotificationApi;
