import { Github, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-800/80 backdrop-blur-md border-t border-slate-700 mt-auto">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-400">
          <div className="flex items-center space-x-2 mb-2 md:mb-0">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>for CSE 318 - Adversarial Search</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>&copy; 2025 Chain Reaction Game</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
