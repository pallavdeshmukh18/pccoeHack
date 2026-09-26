import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Search, Bell, User, LogOut } from 'lucide-react';

const navigation = [
  { name: 'Overview', to: '/dashboard', exact: true },
  { name: 'My Skills', to: '/dashboard/skills', exact: false },
  { name: 'Evidence', to: '/dashboard/evidence', exact: false },
  { name: 'Trajectory', to: '/dashboard/trajectory', exact: false },
  { name: 'Development', to: '/dashboard/development', exact: false },
  { name: 'Career', to: '/dashboard/career', exact: false }
];

const Avatar = ({ user, displayName, getInitial }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <Link to="/dashboard/settings" className="w-8 h-8 rounded-full bg-[#EFEDF8] text-[#7568D8] flex items-center justify-center text-sm font-bold hover:bg-[#E5E3F5] transition-colors border border-[#E8E5F0] overflow-hidden shrink-0">
      {user?.avatarUrl && !imgError ? (
        <img 
            src={user.avatarUrl} 
            alt={`${displayName} profile`} 
            className="w-full h-full object-cover" 
            onError={() => setImgError(true)}
        />
      ) : (
        <span>{getInitial(displayName)}</span>
      )}
    </Link>
  );
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'U';
  const employeeData = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const displayName = employeeData ? `${employeeData.firstName} ${employeeData.lastName}` : user?.name || 'User';

  return (
    <div className="min-h-screen bg-[#F2F1FA] md:p-4 lg:p-6 flex flex-col font-sans text-[#17152F] relative overflow-hidden">
      
      {/* Subtle atmospheric background shapes */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E5E3F5] rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-[30%] h-[50%] bg-[#F0E6F7] rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="bg-white md:rounded-2xl border border-[#E8E5F0] shadow-[0_10px_40px_rgba(50,40,90,0.05)] flex-1 flex flex-col overflow-hidden max-w-[1600px] w-full mx-auto relative z-10">
        
        {/* Top Navigation */}
        <header className="h-16 border-b border-[#E8E5F0] flex items-center justify-between px-4 lg:px-8 shrink-0 bg-white">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-2 w-[200px]">
            <BrainCircuit className="w-6 h-6 text-[#7568D8]" />
            <span className="font-bold text-[15px] text-[#17152F] tracking-wide">TalentTwin</span>
          </div>

          {/* Center: Nav Pills */}
          <nav className="hidden lg:flex items-center gap-2 overflow-x-auto">
            {navigation.map(item => {
              const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.name}
                  to={item.to}
                  className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                    isActive ? 'bg-[#F2F1FA] text-[#7568D8]' : 'text-[#77758A] hover:text-[#17152F] hover:bg-[#F9F8FC]'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-5 w-[200px]">
            <div className="hidden md:flex relative group">
              <Search className="w-4 h-4 text-[#A5A3B5] absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[#7568D8] transition-colors" />
              <input 
                type="text" 
                placeholder="Search capabilities..." 
                className="bg-[#F7F6FB] border border-[#E8E5F0] rounded-full py-2 pl-9 pr-4 text-xs text-[#17152F] placeholder-[#A5A3B5] focus:outline-none focus:border-[#7568D8]/30 focus:bg-white w-48 transition-all"
              />
            </div>
            
            <button className="text-[#A5A3B5] hover:text-[#17152F] transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#F47B82] border-2 border-white rounded-full"></span>
            </button>
            
            <Avatar user={user} displayName={displayName} getInitial={getInitial} />
            
            <button onClick={handleLogout} className="text-[#A5A3B5] hover:text-[#F47B82] transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Nav Scroller */}
        <div className="lg:hidden border-b border-[#E8E5F0] bg-[#FAFAFC] px-4 py-3 flex overflow-x-auto gap-2 hide-scrollbar">
          {navigation.map(item => {
            const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.name}
                to={item.to}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 ${
                  isActive ? 'bg-[#EFEDF8] text-[#7568D8]' : 'text-[#77758A] bg-white border border-[#E8E5F0]'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto bg-white p-4 lg:p-8 xl:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
        
      </div>
    </div>
  );
}
