import {
  FiAward,
  FiTruck,
  FiShield,
  FiCheck,
  FiClock,
  FiZap,
  FiMessageCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiStar,
} from 'react-icons/fi';

const ICON_MAP = {
  FiAward,
  FiTruck,
  FiShield,
  FiCheck,
  FiClock,
  FiZap,
  FiMessageCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiStar,
  check: FiCheck,
  clock: FiClock,
  lightning: FiZap,
  chat: FiMessageCircle,
  map: FiMapPin,
  phone: FiPhone,
  email: FiMail,
};

export const getIconComponent = (iconName, fallback = FiStar) => {
  if (!iconName) return fallback;
  return ICON_MAP[iconName] || fallback;
};
