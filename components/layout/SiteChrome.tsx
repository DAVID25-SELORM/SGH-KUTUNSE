"use client";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileActionBar } from "./MobileActionBar";
import { UtilityBar } from "./UtilityBar";
export function SiteChrome({ position }: { position: "before" | "after" }) {
  if (usePathname().startsWith("/admin")) return null;
  return position === "before" ? <><UtilityBar/><Header/></> : <><Footer/><MobileActionBar/></>;
}
