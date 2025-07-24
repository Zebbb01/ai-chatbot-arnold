// src/app/loading.tsx
import LoadingSpinner from "@/components/ui/loading-spinner";
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary p-4">
      <LoadingSpinner />
    </div>
  );
}