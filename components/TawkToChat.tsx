"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const TAWK_PROPERTY_ID = "6a575999bc88281d438194a2";
const TAWK_WIDGET_ID = "1jtijc07k";

type TawkApi = {
  hideWidget?: () => void;
  showWidget?: () => void;
  maximize?: () => void;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi & Record<string, unknown>;
  }
}

function ChatIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

export default function TawkToChat() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onReady = () => setReady(true);
    const onOpen = () => setChatOpen(true);
    const onClose = () => setChatOpen(false);

    window.addEventListener("tawk-ready", onReady);
    window.addEventListener("tawk-open", onOpen);
    window.addEventListener("tawk-closed", onClose);

    return () => {
      window.removeEventListener("tawk-ready", onReady);
      window.removeEventListener("tawk-open", onOpen);
      window.removeEventListener("tawk-closed", onClose);
    };
  }, []);

  const openChat = useCallback(() => {
    const api = window.Tawk_API;
    if (!api?.showWidget || !api?.maximize) return;
    api.showWidget();
    api.maximize();
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <Script id="tawk-to" strategy="lazyOnload">
        {`
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          Tawk_API.onLoad=function(){
            Tawk_API.hideWidget();
            window.dispatchEvent(new Event("tawk-ready"));
          };
          Tawk_API.onChatMaximized=function(){
            window.dispatchEvent(new Event("tawk-open"));
          };
          Tawk_API.onChatMinimized=function(){
            Tawk_API.hideWidget();
            window.dispatchEvent(new Event("tawk-closed"));
          };
          Tawk_API.onChatHidden=function(){
            Tawk_API.hideWidget();
            window.dispatchEvent(new Event("tawk-closed"));
          };
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        `}
      </Script>

      {ready && !chatOpen ? (
        <button
          type="button"
          onClick={openChat}
          className="fixed bottom-5 right-4 z-[900] flex items-center gap-2 rounded-full bg-[#047857] px-4 py-2.5 text-sm font-medium text-white shadow-md ring-1 ring-black/5 transition hover:bg-[#065f46] focus:outline-none focus:ring-2 focus:ring-[#047857]/40 md:right-5"
          aria-label="Open live chat"
        >
          <ChatIcon />
          Chat
        </button>
      ) : null}
    </>
  );
}
