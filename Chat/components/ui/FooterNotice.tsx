import React from 'react';

interface FooterNoticeProps {
  onOpenCookies: () => void;
}

export const FooterNotice: React.FC<FooterNoticeProps> = ({ onOpenCookies }) => {
  return (
    <div className="text-center pb-2 pt-1 bg-lira-bg">
      <p className="text-[10px] text-gray-600 font-medium flex items-center justify-center gap-1 flex-wrap">
         <span>LiraOS can make mistakes. Check important info.</span>
         <button 
            onClick={onOpenCookies}
            className="text-gray-600 hover:text-white underline underline-offset-2 transition-colors ml-1"
         >
            Cookie Preferences
         </button>
      </p>
    </div>
  );
};
