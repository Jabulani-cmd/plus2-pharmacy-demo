import { Pill, Sparkles, Baby, Leaf, Droplets, Dumbbell, Home, PawPrint } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export type Category = { slug: string; name: string; icon: LucideIcon; image: string };

export const CATEGORIES: Category[] = [
  { slug: "pharmacy", name: "Pharmacy", icon: Pill, image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1200&h=400&fit=crop" },
  { slug: "beauty", name: "Beauty", icon: Sparkles, image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop" },
  { slug: "baby", name: "Baby & Maternity", icon: Baby, image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&h=400&fit=crop" },
  { slug: "vitamins", name: "Vitamins", icon: Leaf, image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=400&fit=crop" },
  { slug: "personal", name: "Personal Care", icon: Droplets, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&h=400&fit=crop" },
  { slug: "sports", name: "Sports Nutrition", icon: Dumbbell, image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=400&fit=crop" },
  { slug: "household", name: "Household", icon: Home, image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1200&h=400&fit=crop" },
  { slug: "pets", name: "Pets", icon: PawPrint, image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&h=400&fit=crop" },
];

export const BRANDS = ["Panado", "Allergex", "Vitaforce", "Bioplus", "Lennon", "Natio", "Neutrogena", "Dove", "Huggies", "USN"];

export const HERO_SLIDES = [
  {
    eyebrow: "Winter Wellness",
    headline: "Up to 30% off Winter Essentials",
    subtext: "Vitamins, cold & flu remedies and immunity boosters — while stocks last.",
    cta: "Shop the sale",
    href: "/category/vitamins",
    image: hero1,
  },
  {
    eyebrow: "Trusted Care",
    headline: "Upload Your Prescription Online",
    subtext: "Our registered pharmacists review every script. Delivery to your door across Zimbabwe.",
    cta: "Upload script",
    href: "/prescriptions",
    image: hero2,
  },
  {
    eyebrow: "Fast Delivery",
    headline: "Free Delivery on Orders Over US$50",
    subtext: "Same-day delivery available in Bulawayo. Tracked & contactless.",
    cta: "Start shopping",
    href: "/category/all",
    image: hero3,
  },
];

export const BLOG_POSTS = [
  { id: "1", category: "Wellness", title: "5 Vitamins to Boost Your Winter Immunity", readTime: "4 min read", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop" },
  { id: "2", category: "Baby Care", title: "A Parent's Guide to Choosing the Right Nappy", readTime: "6 min read", image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=400&fit=crop" },
  { id: "3", category: "Skincare", title: "Why Hyaluronic Acid Belongs in Your Routine", readTime: "5 min read", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=400&fit=crop" },
];