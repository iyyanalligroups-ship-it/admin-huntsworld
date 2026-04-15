// src/redux/api/FAQapi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const FaqApi = createApi({
  reducerPath: "faqApi",
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
  tagTypes: ["FaqTopic", "FaqQuestion"],
  endpoints: (builder) => ({
    // === FAQ TOPICS ===
    getFaqTopics: builder.query({
      query: () => "/faq-topics/fetch-all-faq-topics",
      providesTags: ["FaqTopic"],
    }),

    createFaqTopic: builder.mutation({
      query: (data) => ({
        url: "/faq-topics/create-faq-topic",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FaqTopic"],
    }),

    updateFaqTopic: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/faq-topics/update-faq-topic/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FaqTopic"],
    }),

    deleteFaqTopic: builder.mutation({
      query: (id) => ({
        url: `/faq-topics/delete-faq-topic/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FaqTopic", "FaqQuestion"],
    }),

    // Dropdown topics
    getFaqTopicsForQuestions: builder.query({
      query: ({ type }) => ({
        url: "/faq-topics/fetch-all-faq-topics-for-questions",
        params: type ? { type } : {},
      }),
      providesTags: ["FaqTopic"],
    }),

    // === FAQ QUESTIONS - ROLE SPECIFIC ===
    getFaqQuestionsForBuyer: builder.query({
      query: () => "/faq-questions/fetch-all-faq-questions-for-buyer",
      providesTags: ["FaqQuestion"],
    }),

    getFaqQuestionsForSeller: builder.query({
      query: () => "/faq-questions/fetch-all-faq-questions-for-seller",
      providesTags: ["FaqQuestion"],
    }),

    getFaqQuestionsForGeneral: builder.query({
      query: () => "/faq-questions/fetch-all-faq-questions-for-general",
      providesTags: ["FaqQuestion"],
    }),

    getFaqQuestionsForStudent: builder.query({
      query: () => "/faq-questions/fetch-all-faq-questions-for-student",
      providesTags: ["FaqQuestion"],
    }),

    getFaqQuestionsForBaseMember: builder.query({
      query: () => "/faq-questions/fetch-all-faq-questions-for-baseMember",
      providesTags: ["FaqQuestion"],
    }),

    // === FAQ QUESTIONS CRUD ===
    createFaqQuestion: builder.mutation({
      query: (data) => ({
        url: "/faq-questions/create-faq-question",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FaqQuestion"],
    }),

    updateFaqQuestion: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/faq-questions/update-faq-questions/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FaqQuestion"],
    }),

    deleteFaqQuestion: builder.mutation({
      query: (id) => ({
        url: `/faq-questions/delete-faq-questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FaqQuestion"],
    }),
  }),
});

export const {
  useGetFaqTopicsQuery,
  useCreateFaqTopicMutation,
  useUpdateFaqTopicMutation,
  useDeleteFaqTopicMutation,

  useGetFaqTopicsForQuestionsQuery,

  useGetFaqQuestionsForBuyerQuery,
  useGetFaqQuestionsForSellerQuery,
  useGetFaqQuestionsForGeneralQuery,
  useGetFaqQuestionsForStudentQuery,
  useGetFaqQuestionsForBaseMemberQuery,

  useCreateFaqQuestionMutation,
  useUpdateFaqQuestionMutation,
  useDeleteFaqQuestionMutation,
} = FaqApi;
