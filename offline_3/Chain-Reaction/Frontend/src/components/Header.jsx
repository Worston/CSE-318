import { Gamepad2, Trophy, User } from 'lucide-react';

const Header = ({ title = "Chain Reaction" }) => {
  return (
    <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gamepad2 className="w-8 h-8 text-indigo-500" />
            <h1 className="text-2xl font-bold text-glow">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <User className="w-4 h-4" />
              <span>CSE 318 Assignment</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
