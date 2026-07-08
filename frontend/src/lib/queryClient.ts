import { QueryClient } from '@tanstack/react-query'

// Shared QueryClient instance — imported by main.tsx and available to all hooks
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 1 minute — avoids redundant refetches on tab switch
      staleTime: 1000 * 60,

      // Retry a failed request once before surfacing the error to the UI
      retry: 1,

      // Refetch when the window regains focus — keeps the dashboard up to date
      refetchOnWindowFocus: true,
    },
  },
})

export default queryClient
