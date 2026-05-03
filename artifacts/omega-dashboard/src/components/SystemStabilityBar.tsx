// src/components/SystemStabilityBar.tsx
import { motion } from "framer-motion";

type Props = {
  value: number; // 0 → 100
};

export default function SystemStabilityBar({ value }: Props) {
  const bars = 5;
  const activeBars = Math.round((value / 100) * bars);

  const getColor = () => {
    if (value > 70) return "bg-emerald-400";
    if (value > 40) return "bg-yellow-400";
    return "bg-red-500";
  };

  return (
    <div className="flex items-end gap-1 h-16">
      {[...Array(bars)].map((_, i) => {
        const active = i < activeBars;

        return (
          <motion.div
            key={i}
            initial={{ height: 10 }}
            animate={{ height: active ? 40 + i * 6 : 10 }}
            className={`w-3 rounded-md ${
              active ? getColor() : "bg-gray-700"
            }`}
            transition={{ duration: 0.25 }}
          />
        );
      })}
    </div>
  );
}
