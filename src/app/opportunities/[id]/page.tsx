import { OpportunityDetail } from "@/components/opportunities/OpportunityDetail";

/**
 * The detail page is rendered on the client so that solicitations the user
 * pasted (stored only in their browser) work exactly like the built-in ones.
 */
export default async function OpportunityPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <OpportunityDetail id={decodeURIComponent(id)} />;
}
