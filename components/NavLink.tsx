"use client";

import Link from "next/link";
import { usePageTransition } from "@/lib/page-transition-provider";
import { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function NavLink({ href, children, className, style }: NavLinkProps) {
  const { startTransition } = usePageTransition();

  const handleClick = () => {
    startTransition();
  };

  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
