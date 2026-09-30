import DispenserClient from "./dispenser-client";

export default async function DispenserPage(props: PageProps<"/dispenser/[id]">) {
  const { id } = await props.params;
  return <DispenserClient id={id} />;
}
