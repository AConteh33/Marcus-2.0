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
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-start pt-6 space-y-8 cursor-pointer bg-black/90 hover:bg-black/80 transition-colors"
      onClick={onExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onExpand()}
      aria-label="Expand panel"
    >
      <div className="p-2 text-amber-600">
          <PanelToggleIcon className="w-7 h-7" isPanelVisible={false} />
      </div>
      <IconWithBadge
        icon={<NoteIcon className="w-7 h-7 text-amber-600" />}
        count={newItemsCount.notes}
      />
      <IconWithBadge
        icon={<AppointmentIcon className="w-7 h-7 text-amber-600" />}
        count={newItemsCount.appointments}
      />
      <IconWithBadge
        icon={<AppointmentIcon className="w-7 h-7 text-amber-600" />}
        count={newItemsCount.calendarEvents}
      />
    </div>
  );
};
