import {
  Sandwich,
  Star,
  Flame,
  Citrus,
  CupSoda,
  Beef,
  Drumstick,
} from 'lucide-react';

const ICONS = {
  sandwich: Sandwich,
  star: Star,
  flame: Flame,
  citrus: Citrus,
  cup: CupSoda,
  beef: Beef,
  drumstick: Drumstick,
};

export default function ItemIcon({ name, size = 32, strokeWidth = 1.6, ...rest }) {
  const Cmp = ICONS[name] ?? Sandwich;
  return <Cmp size={size} strokeWidth={strokeWidth} {...rest} />;
}
