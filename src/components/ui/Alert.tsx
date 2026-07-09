import type { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  className?: string;
}

const variantStyles = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

const iconMap = {
  info: "i",
  success: "\u2713",
  warning: "!",
  error: "\u2717",
};

export function Alert({ children, variant = "info", title, className = "" }: AlertProps) {
  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]} ${className}`} role="alert">
      <div className="flex gap-3">
        <span className="text-lg font-bold leading-5" aria-hidden="true">
          {iconMap[variant]}
        </span>
        <div>
          {title && <p className="font-medium">{title}</p>}
          <div className="text-sm mt-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
