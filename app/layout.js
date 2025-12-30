import './globals.css';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://freepresspass.com'),
  title: 'Free Press Pass Generator | First Amendment Journalist Credentials',
  description: 'Generate your free digital press pass for journalism activities. Get recognized under First Amendment protections with our Constitutional Press accreditation.',
  keywords: [
    'press pass',
    'journalist credentials',
    'media accreditation',
    'first amendment',
    'freedom of press',
    'constitutional press',
    'investigative journalist'
  ],
  openGraph: {
    title: 'Free Press Pass Generator',
    description: 'Generate your free digital press pass for journalism activities. Get recognized under First Amendment protections.',
    type: 'website',
    url: 'https://freepresspass.com',
    images: ['/assets/press-pass-preview.jpg']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Press Pass Generator',
    description: 'Generate your free digital press pass for journalism activities. Get recognized under First Amendment protections.',
    images: ['/assets/press-pass-preview.jpg']
  },
  authors: [{ name: 'Constitutional Press Association' }]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="https://sites.super.myninja.ai/_assets/ninja-daytona-script.js" strategy="afterInteractive" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX');`}
        </Script>
      </body>
    </html>
  );
}
