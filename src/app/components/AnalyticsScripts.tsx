import Script from 'next/script'

const GA4_ID    = process.env.NEXT_PUBLIC_GA4_ID
const GADS_ID   = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
const PIXEL_ID  = process.env.NEXT_PUBLIC_META_PIXEL_ID

// ─── Google (GA4 + Google Ads) ────────────────────────────────────────────────
// Um único gtag.js com múltiplas configs — recomendado pelo Google.
// O init roda com beforeInteractive: gtag() fica disponível antes do React
// montar, então nenhum evento disparado no mount é perdido.

function GoogleScripts() {
  const ids = [GA4_ID, GADS_ID].filter(Boolean) as string[]
  if (!ids.length) return null

  const initInline = [
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('js',new Date());",
    ...ids.map((id) => `gtag('config','${id}');`),
  ].join('')

  return (
    <>
      <Script id="gtag-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: initInline }} />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ids[0]}`} strategy="afterInteractive" />
    </>
  )
}

// ─── Meta Pixel ───────────────────────────────────────────────────────────────
// O init inline cria fbq() com fila — eventos chamados antes do SDK carregar
// são processados quando fbevents.js termina de baixar.
// O PageView inicial é disparado aqui; os outros eventos vêm dos componentes.

function MetaPixelScripts() {
  if (!PIXEL_ID) return null

  // Snippet Meta sem a parte de injeção DOM (fbevents.js carrega via next/script)
  const initInline = [
    '!function(f,b,e,v,n,t,s){if(f.fbq)return;',
    'n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};',
    'if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version=\'2.0\';n.queue=[]',
    '}(window,document,\'script\',\'https://connect.facebook.net/en_US/fbevents.js\');',
    `fbq('init','${PIXEL_ID}');`,
    "fbq('track','PageView');",
  ].join('')

  return (
    <>
      <Script id="meta-pixel-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: initInline }} />
      <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />
      {/* Fallback noscript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

export default function AnalyticsScripts() {
  return (
    <>
      <GoogleScripts />
      <MetaPixelScripts />
    </>
  )
}
