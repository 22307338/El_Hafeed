import { createIcons, ArrowLeft, ArrowRight, ArrowUpRight, BellRing, CirclePlay, Clapperboard, Clock3, Facebook, Globe, Headset, HeartHandshake, HousePlus, Info, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, Play, Quote, Search, Share2, ShieldCheck, UsersRound, X } from "lucide";

const iconSet = { ArrowLeft, ArrowRight, ArrowUpRight, BellRing, CirclePlay, Clapperboard, Clock3, Facebook, Globe, Headset, HeartHandshake, HousePlus, Info, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, Play, Quote, Search, Share2, ShieldCheck, UsersRound, X };
window.lucide = { createIcons: () => createIcons({ icons: iconSet }) };
window.lucide.createIcons();
