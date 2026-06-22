import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export function useSEO({ title, description, canonical, ogTitle, ogDescription }: SEOOptions) {
  useEffect(() => {
    document.title = title;

    setMeta("name", "description", description);
    setMeta("property", "og:title", ogTitle ?? title);
    setMeta("property", "og:description", ogDescription ?? description);
    setMeta("property", "og:url", canonical ?? window.location.href);
    setMeta("name", "twitter:title", ogTitle ?? title);
    setMeta("name", "twitter:description", ogDescription ?? description);

    let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical ?? window.location.href;

    return () => {
      document.title = "Ledi – Finn ledig plass nær deg";
    };
  }, [title, description, canonical, ogTitle, ogDescription]);
}

function setMeta(attrKey: string, attrVal: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attrKey}="${attrVal}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrKey, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
