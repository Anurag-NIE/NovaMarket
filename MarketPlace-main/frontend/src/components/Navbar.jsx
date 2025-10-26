import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Moon,
  Sun,
  User,
  LogOut,
  ShoppingBag,
  LayoutDashboard,
  MessageCircle,
  Briefcase,
} from "lucide-react";

import { logout } from "../utils/auth";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [dark, setDark] = React.useState(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      return true;
    }
    return false;
  });

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    const isDark = html.classList.contains("dark");
    setDark(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <Link to="/" className="font-semibold text-xl" data-testid="logo-link">
          <span className="bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-accent))] bg-clip-text text-transparent">
            NovoMarket
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(
                    user.role === "seller"
                      ? "/seller-dashboard"
                      : "/buyer-dashboard"
                  )
                }
                data-testid="dashboard-button"
              >
                <LayoutDashboard size={18} className="mr-2" />
                Dashboard
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/services")}
                data-testid="services-button"
              >
                <Briefcase size={18} className="mr-2" />
                Services
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/chat")}
                data-testid="chat-button"
              >
                <MessageCircle size={18} className="mr-2" />
                Chat
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="user-menu-button"
                  >
                    <User size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="font-medium">
                    {user.name}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <LogOut size={14} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                data-testid="login-button"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/register")}
                data-testid="register-button"
              >
                Get Started
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            data-testid="darkmode-toggle-button"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
