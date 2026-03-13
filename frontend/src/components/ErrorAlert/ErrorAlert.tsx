import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
}

function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
      <span className="text-xs font-medium text-red-600">{message}</span>
    </div>
  );
}

export default ErrorAlert;
