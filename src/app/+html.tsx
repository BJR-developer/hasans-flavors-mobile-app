import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const globalWebStyles = `
/* Global reset for web inputs, textareas, and select elements */
input, textarea, select, [contenteditable="true"] {
  outline: none !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;
}

input:focus, textarea:focus, select:focus, [contenteditable="true"]:focus {
  outline: none !important;
  outline-width: 0 !important;
  outline-style: none !important;
  box-shadow: none !important;
}

input:focus-visible, textarea:focus-visible, select:focus-visible {
  outline: none !important;
  outline-width: 0 !important;
}

/* Prevent unwanted browser autofill background styling */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset !important;
  -webkit-text-fill-color: #2D2926 !important;
  transition: background-color 5000s ease-in-out 0s;
}

/* Thermal POS Receipt Print Stylesheet (Authentic 80mm ESC/POS layout) */
@page {
  size: 80mm auto;
  margin: 0mm;
}

@media print {
  html, body {
    width: 80mm !important;
    max-width: 80mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #FFFFFF !important;
    color: #000000 !important;
    font-family: 'Courier New', Courier, monospace !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Hide entire web app by default */
  body * {
    visibility: hidden !important;
  }

  /* Expose strictly the dedicated printable receipt slip */
  #pos-printable-receipt,
  #pos-printable-receipt *:not(#no-print):not(#no-print *):not(.no-print):not(.no-print *) {
    visibility: visible !important;
  }

  #pos-printable-receipt {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 76mm !important;
    max-width: 76mm !important;
    margin: 0 auto !important;
    padding: 2mm 3mm !important;
    background: #FFFFFF !important;
    color: #000000 !important;
    box-shadow: none !important;
    border: none !important;
    font-family: 'Courier New', Courier, monospace !important;
  }

  /* Absolutely hide action buttons, modal triggers and navigation from print output */
  #no-print,
  #no-print *,
  .no-print,
  .no-print *,
  [data-no-print="true"],
  [data-no-print="true"] * {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    opacity: 0 !important;
  }
}
`;

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalWebStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
