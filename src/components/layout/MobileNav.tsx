"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/detection/image", label: "Image" },
  { href: "/detection/video", label: "Video" },
  { href: "/detection/webcam", label: "Webcam" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
  { href: "/about", label: "About" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <div className="md:hidden">
      <button
        onClick={toggle}
        className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg">
          <nav className="flex flex-col p-4 gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive =
                pathname === href ||
                (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
