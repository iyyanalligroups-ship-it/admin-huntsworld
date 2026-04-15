import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const UserSubscriptionPlanApi = createApi({
  reducerPath: 'UserSubscriptionPlanApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    // 🔴 CRITICAL FIX: Robust token retrieval for Admin & Merchant panels
    prepareHeaders: (headers, { getState }) => {
      // 1. Try to get token from Redux auth slice
      let token = getState().auth?.token || getState().auth?.user?.token;

      // 2. Fallback to sessionStorage if Redux is empty (common in Admin flows)
      if (!token) {
        token = sessionStorage.getItem("token");
      }

      if (token) {
        // Standardized uppercase 'Authorization'
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Plans', 'UserSubscriptions', 'SubscriptionPlans', 'EbookPayments'],
  endpoints: (builder) => ({
    // 🔹 Fetch all plan mappings (grouped with features)
    getAllPlans: builder.query({
      query: () => '/subscription-plans-elements-mapping/fetch-all-subscriptionplanelementmappings',
      providesTags: ['Plans'],
    }),

    // 🔹 Fetch specific user's active plan
    getUserActiveSubscription: builder.query({
      query: (user_id) => `/user-subscription-plan/fetch-user-active-subscription/${user_id}`,
      providesTags: ['UserSubscriptions'],
    }),

    // 🔹 Cancel a specific subscription
    cancelSubscription: builder.mutation({
      query: (id) => ({
        url: `/user-subscription-plan/cancel-usersubscriptionplans/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['UserSubscriptions'],
    }),

    // 🔹 Create a brand new subscription
    createSubscription: builder.mutation({
      query: (subscription) => ({
        url: '/user-subscription-plan/create-usersubscriptionplans',
        method: 'POST',
        body: subscription,
      }),
      invalidatesTags: ['UserSubscriptions'],
    }),

    // 🔹 Upgrade an existing subscription (Fixed Path Synchronization)
    upgradeSubscription: builder.mutation({
      query: (data) => ({
        url: '/user-subscription-plan/upgrade-usersubscriptionplans',
        method: 'POST', // 🟢 This ensures you don't get "Cannot GET"
        body: data,
      }),
      invalidatesTags: ['UserSubscriptions'],
    }),

    // 🔹 Update a plan's metadata
    updatePlan: builder.mutation({
      query: ({ id, ...plan }) => ({
        url: `/user-subscription-plan/update-usersubscriptionplans-by-id/${id}`,
        method: 'PUT',
        body: plan,
      }),
      invalidatesTags: ['Plans'],
    }),

    // 🔹 Delete a plan record
    deletePlan: builder.mutation({
      query: (id) => ({
        url: `/user-subscription-plan/delete-usersubscriptionplans-by-id/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Plans'],
    }),

    // 🔹 Razorpay Order Creation
    createRazorpayOrder: builder.mutation({
      query: ({ user_id, subscription_plan_id, amount, auto_off, auto_renew, is_upgrade }) => ({
        url: '/user-subscription-plan/create-order',
        method: 'POST',
        body: { user_id, subscription_plan_id, amount, auto_off, auto_renew, is_upgrade },
      }),
    }),

    // 🔹 Razorpay Payment Verification
    verifyPayment: builder.mutation({
      query: (paymentData) => ({
        url: '/user-subscription-plan/verify-payment',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['UserSubscriptions'],
    }),

    // 🔹 Toggle Auto Pay (Recurring Billing)
    toggleAutoPay: builder.mutation({
      query: ({ id, auto_renew }) => ({
        url: `/user-subscription-plan/subscriptions/${id}/toggle-autopay`,
        method: 'PATCH',
        body: { auto_renew },
      }),
      invalidatesTags: ['UserSubscriptions'],
    }),

    // 🔹 Admin: Search for merchant by email or phone
    getUserBySearch: builder.query({
      query: (searchValue) =>
        `/user-subscription-plan/fetch-merchant-by-number-or-email?query=${encodeURIComponent(searchValue)}`,
      providesTags: ['UserSubscriptions'],
    }),

    // 🔹 Admin: Search for users for wallet management (User, Merchant, Student, Grocery Seller)
    getUsersForWallet: builder.query({
      query: (searchValue) =>
        `/user-subscription-plan/fetch-users-for-wallet?query=${encodeURIComponent(searchValue)}`,
      providesTags: ['UserSubscriptions'],
    }),

    // 🔹 Admin: Fetch all active subscriptions (Paginated)
    getAllActiveSubscriptions: builder.query({
      query: ({ page = 1, limit = 5 }) =>
        `/user-subscription-plan/active/all?page=${page}&limit=${limit}`,
      providesTags: ['UserSubscriptions'],
    }),

    // 🔹 Fetch plans with full details
    getPlansWithDetails: builder.query({
      query: () => '/subscription-plans/fetch-all-subscriptionplans-with-details',
      providesTags: ['SubscriptionPlans'],
    }),

    // 🔹 E-book Payment Endpoints
    getAllActiveEbookPayments: builder.query({
      query: ({ page = 1, limit = 5 }) => `/e-book-payment/active-ebook-payments?page=${page}&limit=${limit}`,
      providesTags: ['UserSubscriptions'],
    }),

    getAllAtOnceActiveEbookPayments: builder.query({
      query: ({ page = 1, limit = 5 }) => ({
        url: `/e-book-payment/active-allonce-ebook-payments?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['EbookPayments', 'UserSubscriptions'],
    }),

    getSubscriptionStatus: builder.query({
      query: (userId) => `/user-subscription-plan/subscriptions/subscription-status/${userId}`,
      providesTags: ['UserSubscriptions'],
    }),

    cancelEbook: builder.mutation({
      query: (ebook_payment_id) => ({
        url: '/e-book-payment/cancel',
        method: 'POST',
        body: { ebook_payment_id },
      }),
      invalidatesTags: ['EbookPayments', 'UserSubscriptions'],
    }),
  }),
});

export const {
  useGetAllPlansQuery,
  useGetUserBySearchQuery,
  useGetUsersForWalletQuery,
  useGetAllActiveSubscriptionsQuery,
  useGetAllAtOnceActiveEbookPaymentsQuery,
  useGetPlansWithDetailsQuery,
  useGetAllActiveEbookPaymentsQuery,
  useGetUserActiveSubscriptionQuery,
  useCreateSubscriptionMutation,
  useUpgradeSubscriptionMutation,
  useUpdatePlanMutation,
  useCancelSubscriptionMutation,
  useDeletePlanMutation,
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
  useToggleAutoPayMutation,
  useGetSubscriptionStatusQuery,
  useCancelEbookMutation,
} = UserSubscriptionPlanApi;
