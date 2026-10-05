import { notFound } from "next/navigation";

// Any address inside a language folder that isn't a page shows the not-found page in that language.
export default function CatchAll() {
  notFound();
}
