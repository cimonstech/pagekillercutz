/**
 * Central GSAP setup.
 * Import from here so plugins are only registered once and never on the server.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
export default gsap;
