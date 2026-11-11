import { createIcons, ArrowLeft, ArrowRight, ArrowUpRight, BellRing, CirclePlay, Clapperboard, Clock3, Facebook, Globe, Headset, HeartHandshake, HousePlus, Info, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, Play, Quote, Search, Share2, ShieldCheck, UsersRound, X } from "lucide";

const PersonProtected = [
  ["path", { d: "M12 2.5 20 5.7v5c0 5-3.4 8.4-8 10.8-4.6-2.4-8-5.8-8-10.8v-5l8-3.2Z" }],
  ["circle", { cx: "12", cy: "8", r: "1.5" }],
  ["path", { d: "M12 9.5v4m-3-2 3 1.2 3-1.2M12 13.5l-2 4m2-4 2 4" }],
];

const iconSet = { ArrowLeft, ArrowRight, ArrowUpRight, BellRing, CirclePlay, Clapperboard, Clock3, Facebook, Globe, Headset, HeartHandshake, HousePlus, Info, Instagram, Mail, MapPin, Menu, MessageCircle, PersonProtected, Phone, Play, Quote, Search, Share2, ShieldCheck, UsersRound, X };
window.lucide = { createIcons: () => createIcons({ icons: iconSet }) };
window.lucide.createIcons();
