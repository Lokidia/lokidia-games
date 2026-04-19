"use client";

import { useEffect } from "react";
import { getConsent, type ConsentPreferences } from "@/lib/consent";

function loadPlausible() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return;
  if (document.querySelector(`script[data-domain="${domain}"]`)) return;
  const s = document.createElement("script");
  s.defer = true;
  s.setAttribute("data-domain", domain);
  s.src = "https://plausible.io/js/script.js";
  document.head.appendChild(s);
}

function loadGA() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return;
  if (document.querySelector(`script[src*="gtag/js"]`)) return;

  const s1 = document.createElement("script");
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s1);

  const s2 = document.createElement("script");
  s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`;
  document.head.appendChild(s2);
}

function applyConsent(prefs: ConsentPreferences | null) {
  if (!prefs?.analytics) return;
  loadPlausible();
  loadGA();
}

export default function AnalyticsLoader() {
  useEffect(() => {
    // Apply on mount for returning visitors who already consented
    applyConsent(getConsent());

    // Apply when the user updates their consent in this session
    function onUpdate(e: Event) {
      applyConsent((e as CustomEvent<ConsentPreferences>).detail);
    }
    window.addEventListener("consent-updated", onUpdate);
    return () => window.removeEventListener("consent-updated", onUpdate);
  }, []);

  return null;
}
