import { useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Account from "./pages/Account";
import Imprint from "./pages/Imprint";
import Login from "./pages/Login";
import Outfits from "./pages/Outfits";
import Privacy from "./pages/Privacy";
import Register from "./pages/Register";
import Wardrobe from "./pages/Wardrobe";

function Logo() {
  return (
    <Link to="/" className="navbar-logo">
      Couture<span className="navbar-logo-dot">.</span>
    </Link>
  );
}

function NavLinks({ onNavigate }) {
  const { token, logout } = useAuth();

  return (
    <>
      <NavLink
        to="/"
        end
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        onClick={onNavigate}
      >
        Garderobe
      </NavLink>
      <NavLink
        to="/outfits"
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        onClick={onNavigate}
      >
        Outfits
      </NavLink>
      {token ? (
        <>
          <NavLink
            to="/account"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            onClick={onNavigate}
          >
            Konto
          </NavLink>
          <button
            type="button"
            className="nav-link nav-button"
            onClick={() => {
              logout();
              if (onNavigate) onNavigate();
            }}
          >
            Abmelden
          </button>
        </>
      ) : (
        <>
          <NavLink
            to="/login"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            onClick={onNavigate}
          >
            Anmelden
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            onClick={onNavigate}
          >
            Registrieren
          </NavLink>
        </>
      )}
    </>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Logo />
        <nav aria-label="Hauptnavigation" className="navbar-links">
          <NavLinks />
        </nav>
        <button
          type="button"
          className="navbar-toggle"
          aria-label="Menü öffnen"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
        </button>
      </div>
      {open && (
        <nav aria-label="Mobile Navigation" className="navbar-mobile">
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">Couture</span>
        <nav aria-label="Rechtliches" className="footer-links">
          <Link to="/impressum" className="footer-link">
            Impressum
          </Link>
          <Link to="/datenschutz" className="footer-link">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app-shell">
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Wardrobe />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/outfits" element={<Outfits />} />
              <Route path="/account" element={<Account />} />
              <Route path="/impressum" element={<Imprint />} />
              <Route path="/datenschutz" element={<Privacy />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
