export default function Head() {
  const siteUrl = 'https://calmwave-landingpage.vercel.app/'
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": siteUrl + "#organization",
        "name": "CalmWave",
        "url": siteUrl,
        "logo": siteUrl + "logo.png",
        "sameAs": []
      },
      {
        "@type": "WebSite",
        "@id": siteUrl + "#website",
        "url": siteUrl,
        "name": "CalmWave",
        "description": "Solução de redução de ruído para crianças com TPAC usando inteligência artificial.",
        "publisher": { "@id": siteUrl + "#organization" }
      }
    ]
  }

  return (
    <>
      {/* Canonical - metadata.alternates also sets it, but explicit link helps some crawlers */}
      <link rel="canonical" href={siteUrl} />

      {/* Helpful extras for sharing and accessibility */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
