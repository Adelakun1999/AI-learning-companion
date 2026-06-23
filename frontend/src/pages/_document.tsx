import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <Head>
        {/* Outfit = display/headings (friendly, slightly rounded —
            avoids the "generic SaaS" feel of a typical grotesque).
            Inter = body text, optimized for long-form reading since
            agent responses can run several paragraphs. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased bg-base text-text">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
