interface StructuredDataProps {
  data: object;
}

/** JSON-LD for search engines — safe in Server Components (no client JS). */
export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}
