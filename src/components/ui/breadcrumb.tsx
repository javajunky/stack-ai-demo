import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  children: React.ReactNode;
}

export interface BreadcrumbItemProps
  extends React.ComponentPropsWithoutRef<"li"> {
  children: React.ReactNode;
}

export interface BreadcrumbLinkProps
  extends React.ComponentPropsWithoutRef<"button"> {
  children: React.ReactNode;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      className={cn(
        "flex items-center text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, children, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    >
      {children}
      <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
    </li>
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<HTMLButtonElement, BreadcrumbLinkProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "hover:text-foreground text-muted-foreground transition-colors font-medium",
        className
      )}
      {...props}
    />
  )
);
BreadcrumbLink.displayName = "BreadcrumbLink";

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink };
