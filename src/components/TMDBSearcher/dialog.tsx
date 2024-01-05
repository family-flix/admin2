import { Show, createSignal } from "solid-js";

import { Dialog } from "@/components/ui/dialog";

import { TMDBSearcherDialogCore } from "./store";
import { TMDBSearcherView } from "./searcher";

export function TMDBSearcherDialog(props: { store: TMDBSearcherDialogCore }) {
  const { store } = props;

  return (
    <Dialog store={store.dialog}>
      <div class="w-[520px]">
        <TMDBSearcherView store={store.tmdb} />
      </div>
    </Dialog>
  );
}
