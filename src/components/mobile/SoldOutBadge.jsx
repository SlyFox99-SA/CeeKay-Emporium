import { motion } from 'framer-motion';

export default function SoldOutBadge() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="ck-soldout-badge"
    >
      Sold out
    </motion.span>
  );
}