import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle, XCircle, InfoIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 mb-4 text-sm flex items-start gap-3 shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        success:
          "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800",
        warning:
          "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800",
        error:
          "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800",
        info: "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

interface DashboardAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description: string;
  onClose?: () => void;
  showIcon?: boolean;
}

const iconMap = {
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  info: InfoIcon,
};

export function DashboardAlert({
  className,
  variant = "info",
  title,
  description,
  onClose,
  showIcon = true,
  ...props
}: DashboardAlertProps) {
  const IconComponent = iconMap[variant as keyof typeof iconMap];

  return (
    <div
      className={cn(
        alertVariants({ variant }),
        "animate-in fade-in slide-in-from-top-1",
        className
      )}
      role="alert"
      {...props}
    >
      {showIcon && (
        <IconComponent
          className="h-5 w-5 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
      )}
      <div className="flex-1 space-y-1">
        {title && (
          <h3 className="font-medium leading-tight tracking-tight">{title}</h3>
        )}
        <div className="text-sm/relaxed opacity-90">{description}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto flex-shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
