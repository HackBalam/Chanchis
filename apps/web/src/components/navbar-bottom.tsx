"use client";

interface NavbarBottomProps {
  activeView: "home" | "stores";
  onViewChange: (view: "home" | "stores") => void;
}

export function NavbarBottom({ activeView, onViewChange }: NavbarBottomProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-40">
      <div className="max-w-md mx-auto flex">
        {/* Home Tab */}
        <button
          onClick={() => onViewChange("home")}
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
            activeView === "home"
              ? "text-orange-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mb-1"
            fill={activeView === "home" ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={activeView === "home" ? 0 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs font-medium">Home</span>
          {activeView === "home" && (
            <div className="absolute bottom-0 w-12 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" />
          )}
        </button>

        {/* Stores Tab */}
        <button
          onClick={() => onViewChange("stores")}
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors relative ${
            activeView === "stores"
              ? "text-orange-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mb-1"
            fill={activeView === "stores" ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={activeView === "stores" ? 0 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="text-xs font-medium">Stores</span>
          {activeView === "stores" && (
            <div className="absolute bottom-0 w-12 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
}
