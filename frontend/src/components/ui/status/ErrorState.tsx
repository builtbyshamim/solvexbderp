import { AlertCircle } from "lucide-react";

 export const ErrorState = ({ message, refetch }:any) => (
  <div className="flex flex-col items-center justify-center py-16 text-red-500">
    <AlertCircle size={40} className="mb-2" />
    <p className="font-semibold">{message}</p>
    <button onClick={() => refetch()} className="mt-4 cursor-pointer text-sm underline text-gray-600 hover:text-primary-600">
      Try Again
    </button>
  </div>
);