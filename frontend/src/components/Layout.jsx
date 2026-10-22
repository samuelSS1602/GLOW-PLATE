import { NavLink, Outlet, Link } from "react-router-dom";
import { Home, CalendarDays, Leaf, UserRound, Camera } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { to: "/", label: "Today", icon: Home, end: true },
  { to: "/history", label: "History", icon: CalendarDays },
  { to: "/plan", label: "My plan", icon: Leaf },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function Credit() {
  return (
    <p className="credit">
      Developed by <a href="https://codecrafters-pi.vercel.app/" target="_blank" rel="noopener noreferrer"><strong>Code Crafters</strong></a>
    </p>
  );
}

export default function Layout() {
  const { user } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <img src="/icon.svg" alt="" width="34" height="34" />
          <span>GlowPlate</span>
        </Link>
        <Link to="/add" className="btn btn-primary btn-block side-add">
          <Camera size={18} /> Add a meal
        </Link>
        <nav className="side-nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon size={19} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          {user?.photoURL && <img className="avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
          <span className="muted small">{user?.displayName}</span>
        </div>
        <Credit />
      </aside>

      <main className="main">
        <Outlet />
        <div className="mobile-credit"><Credit /></div>
      </main>

      <nav className="tabbar" aria-label="Main">
        {NAV.slice(0, 2).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab">
            <Icon size={21} /><span>{label}</span>
          </NavLink>
        ))}
        <Link to="/add" className="tab-add" aria-label="Add a meal">
          <Camera size={24} />
        </Link>
        {NAV.slice(2).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="tab">
            <Icon size={21} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
