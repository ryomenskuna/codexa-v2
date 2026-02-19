import { useAuth } from "../context/authContext";
import { Link, NavLink } from "react-router-dom";
import { UserContext } from "../context/userContext";
import React, { useContext, useState } from "react";

const Navbar = () => {
  const { user } = useContext(UserContext);
  const { setAuthType } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const closeMenu = () => setIsOpen(false);

  const linkBase =
    "text-sm md:text-base px-2 py-1 rounded-md transition-colors";

  const navLinkClass = ({ isActive }) =>
    `${linkBase} ${
      isActive ? "text-white bg-gray-800" : "text-gray-300 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-[#070B13]/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        <Link
          to="/home"
          className="text-white text-2xl md:text-3xl font-bold tracking-tight"
          onClick={closeMenu}
        >
          codeXa
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/contests" className={navLinkClass}>
            Contests
          </NavLink>
          <NavLink to="/quizzes" className={navLinkClass}>
            Quizzes
          </NavLink>
          <NavLink to="/events" className={navLinkClass}>
            Events
          </NavLink>

          {user ? (
            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-gray-700 inline-flex items-center justify-center text-lg font-semibold text-white border border-gray-500"
            >
              {user.first_name?.charAt(0).toUpperCase()}
            </Link>
          ) : (
            <button
              onClick={() => setAuthType("login")}
              className="bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 rounded-md text-sm font-medium text-white hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Toggle navigation"
          onClick={toggleMenu}
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-800 bg-[#070B13]">
          <div className="space-y-1 px-4 pt-2 pb-3">
            <NavLink
              to="/contests"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Contests
            </NavLink>
            <NavLink
              to="/quizzes"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Quizzes
            </NavLink>
            <NavLink
              to="/events"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Events
            </NavLink>

            <div className="pt-2">
              {user ? (
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-gray-200 px-2 py-1.5"
                >
                  <span className="w-8 h-8 rounded-full bg-gray-700 inline-flex items-center justify-center text-base font-semibold text-white">
                    {user.first_name?.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm">Profile</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setAuthType("login");
                    closeMenu();
                  }}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-md text-sm font-medium text-white mt-1"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
