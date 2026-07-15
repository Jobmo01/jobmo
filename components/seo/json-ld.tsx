/** Renders a JSON-LD structured data block. Using JSON.stringify (not raw
 *  template interpolation) avoids breaking the page if a job description or
 *  company name ever contains a `</script>`-like sequence. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
