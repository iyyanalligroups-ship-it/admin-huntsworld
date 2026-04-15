import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const AdminDashboardApi = createApi({
  reducerPath: 'AdminDashboard',
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
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => '/admin-dashboard/fetch-admin-dashboard-data',
    }),
  }),
});

export const { useGetDashboardQuery } = AdminDashboardApi;