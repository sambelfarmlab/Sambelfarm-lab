import { useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { motion, useMotionValue, animate, type PanInfo, useTransform } from "framer-motion";

export interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  onClick: () => void;
  direction: "left" | "right";
}

interface Props {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeFull?: (direction: "left" | "right") => void;
}

const ACTION_W = 80;

export const SwipeableItem = forwardRef<{ reset: () => void }, Props>(function SwipeableItem({ children, leftActions = [], rightActions = [] }, ref) {
  const x = useMotionValue(0);
  const [isOpen, setIsOpen] = useState<"left" | "right" | null>(null);
  
  const totalLeftW = ACTION_W * leftActions.length;
  const totalRightW = ACTION_W * rightActions.length;

  const snapClose = useCallback(() => {
    animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
    setIsOpen(null);
  }, [x]);

  // Expose reset method to parent
  useImperativeHandle(ref, () => ({
    reset: snapClose,
  }), [snapClose]);

  const snapOpenLeft = useCallback(() => {
    animate(x, totalLeftW, { type: "spring", stiffness: 400, damping: 40 });
    setIsOpen("left");
  }, [x, totalLeftW]);

  const snapOpenRight = useCallback(() => {
    animate(x, -totalRightW, { type: "spring", stiffness: 400, damping: 40 });
    setIsOpen("right");
  }, [x, totalRightW]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if (isOpen === "left") {
      if (velocity.x < -200 || offset.x < totalLeftW * 0.5) snapClose();
      else snapOpenLeft();
    } else if (isOpen === "right") {
      if (velocity.x > 200 || offset.x > -totalRightW * 0.5) snapClose();
      else snapOpenRight();
    } else {
      if (velocity.x > 200 || offset.x > totalLeftW * 0.3 && totalLeftW > 0) {
        snapOpenLeft();
      } else if (velocity.x < -200 || offset.x < -totalRightW * 0.3 && totalRightW > 0) {
        snapOpenRight();
      } else {
        snapClose();
      }
    }
  };

  // Background opacity based on drag
  const leftOpacity = useTransform(x, [0, 40], [0, 1]);
  const rightOpacity = useTransform(x, [0, -40], [0, 1]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-muted/20" data-testid="swipeable-item">
      {/* Left Actions (Appear when swiping right) */}
      {leftActions.length > 0 && (
        <motion.div 
          className="absolute inset-y-0 left-0 flex" 
          style={{ width: totalLeftW, opacity: leftOpacity }}
        >
          {leftActions.map((action) => (
            <button
              key={action.label}
              className={`flex flex-col items-center justify-center gap-1 text-white select-none h-full ${action.bgClass}`}
              style={{ width: ACTION_W }}
              onClick={(e) => {
                e.stopPropagation();
                snapClose();
                setTimeout(action.onClick, 150);
              }}
            >
              <span className="text-lg">{action.icon}</span>
              <span className="text-[10px] font-bold uppercase">{action.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Right Actions (Appear when swiping left) */}
      {rightActions.length > 0 && (
        <motion.div 
          className="absolute inset-y-0 right-0 flex" 
          style={{ width: totalRightW, opacity: rightOpacity }}
        >
          {rightActions.map((action) => (
            <button
              key={action.label}
              className={`flex flex-col items-center justify-center gap-1 text-white select-none h-full ${action.bgClass}`}
              style={{ width: ACTION_W }}
              onClick={(e) => {
                e.stopPropagation();
                snapClose();
                setTimeout(action.onClick, 150);
              }}
            >
              <span className="text-lg">{action.icon}</span>
              <span className="text-[10px] font-bold uppercase">{action.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      <motion.div
        drag="x"
        dragConstraints={{ left: -totalRightW, right: totalLeftW }}
        dragElastic={0.1}
        style={{ x, position: "relative", zIndex: 10 }}
        onDragEnd={handleDragEnd}
        className="touch-pan-y"
        data-testid="swipeable-item-content"
      >
        {children}
      </motion.div>
    </div>
  );
});

SwipeableItem.displayName = "SwipeableItem";
