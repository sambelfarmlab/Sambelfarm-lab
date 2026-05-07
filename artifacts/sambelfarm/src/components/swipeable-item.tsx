import { useCallback, useState } from "react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";

export interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  onClick: () => void;
}

interface Props {
  children: React.ReactNode;
  actions: SwipeAction[];
}

const ACTION_W = 70;

export function SwipeableItem({ children, actions }: Props) {
  const x = useMotionValue(0);
  const [isOpen, setIsOpen] = useState(false);
  const totalW = ACTION_W * actions.length;

  const snapClose = useCallback(() => {
    animate(x, 0, { type: "spring", stiffness: 420, damping: 34, mass: 0.75 });
    setIsOpen(false);
  }, [x]);

  const snapOpen = useCallback(() => {
    animate(x, -totalW, { type: "spring", stiffness: 420, damping: 34, mass: 0.75 });
    setIsOpen(true);
  }, [x, totalW]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    if (isOpen) {
      if (velocity.x > 250 || offset.x > totalW * 0.35) snapClose();
      else snapOpen();
    } else {
      if (velocity.x < -250 || offset.x < -(totalW * 0.38)) snapOpen();
      else snapClose();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: totalW }}>
        {actions.map((action) => (
          <button
            key={action.label}
            className={`flex flex-col items-center justify-center gap-1 text-white select-none ${action.bgClass}`}
            style={{ width: ACTION_W }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              snapClose();
              setTimeout(action.onClick, 120);
            }}
          >
            <span className="text-base leading-none">{action.icon}</span>
            <span className="text-[9px] font-semibold leading-none mt-0.5">{action.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -totalW, right: 0 }}
        dragElastic={{ left: 0.04, right: 0.04 }}
        dragMomentum={false}
        style={{ x, position: "relative", zIndex: 10 }}
        onDragEnd={handleDragEnd}
        onClickCapture={isOpen ? (e) => { e.stopPropagation(); snapClose(); } : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}
