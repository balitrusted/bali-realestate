"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const TAWK_PROPERTY_ID = "6a575999bc88281d438194a2";
const TAWK_WIDGET_ID = "1jtijc07k";

export default function TawkToChat() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <Script id="tawk-to" strategy="lazyOnload">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
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
  );
}
