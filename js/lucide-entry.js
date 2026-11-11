import { createIcons, ArrowLeft, ArrowRight, ArrowUpRight, BellRing, CirclePlay, Clapperboard, Clock3, Facebook, Globe, Headset, HeartHandshake, HousePlus, Info, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, Play, Quote, Search, Share2, ShieldCheck, UsersRound, X } from "lucide";

const PersonProtected = [
  ["path", { d: "M12 2.5 19.5 5.6v5.1c0 4.9-3.05 8.2-7.5 10.8-4.45-2.6-7.5-5.9-7.5-10.8V5.6L12 2.5Z" }],
  ["circle", { cx: "12", cy: "8.5", r: "2", fill: "currentColor", stroke: "none" }],
  ["path", { d: "M7.25 17.9c.35-3.15 1.95-4.9 4.75-4.9s4.4 1.75 4.75 4.9c-1.35 1.1-2.95 1.65-4.75 1.65s-3.4-.55-4.75-1.65Z", fill: "currentColor", stroke: "none" }],
];

const iconSet = { ArrowLeft, ArrowRight, ArrowUpRight, BellRing, CirclePlay, Clapperboard, Clock3, Facebook, Globe, Headset, HeartHandshake, HousePlus, Info, Instagram, Mail, MapPin, Menu, MessageCircle, PersonProtected, Phone, Play, Quote, Search, Share2, ShieldCheck, UsersRound, X };
window.lucide = { createIcons: () => createIcons({ icons: iconSet }) };
window.lucide.createIcons();
