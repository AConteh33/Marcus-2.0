import React from 'react';
import { NoteIcon, AppointmentIcon, PanelToggleIcon } from './Icons';

interface CollapsedPanelProps {
  newItemsCount: {
    notes: number;
    appointments: number;
    calendarEvents: number;
  };
  onExpand: () => void;
}

const IconWithBadge: React.FC<{ icon: React.ReactNode; count: number; }> = ({ icon, count }) => (
  <div className="relative p-2">
    {icon}
    {count > 0 && (
      <span className="absolute top-0 right-0 block h-5 w-5 transform translate-x-1/4 -translate-y-1/4 rounded-full bg-red-600 text-white text-xs font-bold ring-2 ring-black/50 flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </div>
);

export const CollapsedPanel: React.FC<CollapsedPanelProps> = ({
  newItemsCount,
  onExpand,
}) => {
  const totalNewItems = newItemsCount.notes + newItemsCount.appointments + newItemsCount.calendarEvents;
  
  return (
    <div
      onClick={onExpand}
      className="w-full h-full flex items-center justify-center cursor-pointer group"
    >
      <div className="relative p-1.5 text-yellow-400 hover:text-yellow-300 rounded-full bg-gray-900/90 hover:bg-yellow-500/20 border border-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200">
        <PanelToggleIcon className="w-6 h-6" isPanelVisible={false} />
        {totalNewItems > 0 && (
          <span className="absolute -top-1 -right-1 block h-5 w-5 transform rounded-full bg-red-600 text-white text-xs font-bold ring-2 ring-black/50 flex items-center justify-center">
            {totalNewItems > 9 ? '9+' : totalNewItems}
          </span>
        )}
      </div>
    </div>
  );
};
