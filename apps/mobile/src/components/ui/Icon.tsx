import { Feather } from '@expo/vector-icons';
import { ViewStyle } from 'react-native';

export type IconName = string;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const iconMap: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  Image: 'image',
  Plus: 'plus',
  Search: 'search',
  Heart: 'heart',
  Send: 'send',
  Receipt: 'file-text',
  Trash2: 'trash-2',
  Minus: 'minus',
  home: 'home',
  grid: 'grid',
  heart: 'heart',
  'credit-card': 'credit-card',
  'shopping-bag': 'shopping-bag',
  banknote: 'dollar-sign',
  'sliders-horizontal': 'sliders',
  'ticket-percent': 'tag',
  store: 'shopping-bag',
};

export function Icon({ name, size = 24, color = '#0f172a', style }: IconProps) {
  const mappedName = iconMap[name] || (name.toLowerCase() as any);
  return <Feather name={mappedName} size={size} color={color} style={style as any} />;
}
