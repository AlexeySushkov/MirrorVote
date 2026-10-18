import { useQuery } from '@tanstack/react-query'
import { fetchCountry, getBrowserTimezone, hasUsedGoogle, shouldShowGoogle } from '@/utils/geo'

export function useGoogleAuthAvailable() {
  const usedGoogle = hasUsedGoogle()
  const { data: country, isPending } = useQuery({
    queryKey: ['geo-country'],
    queryFn: fetchCountry,
    staleTime: Infinity,
    retry: false,
    enabled: !usedGoogle,
  })

  if (usedGoogle) return { showGoogle: true, loading: false }
  // Hide while loading so the button doesn't flash for users in Russia.
  if (isPending) return { showGoogle: false, loading: true }
  return {
    showGoogle: shouldShowGoogle({ country: country ?? null, timezone: getBrowserTimezone(), usedGoogle }),
    loading: false,
  }
}
