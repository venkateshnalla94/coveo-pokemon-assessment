import { DataList } from "@/components/ui/DataList";
import { CONTENT } from "@/content/pokedex";

/** EV yield, base friendship, growth rate — see docs/EXECUTION-PLAN-v2.3-frontend.md §4. */
export interface TrainingPanelProps {
  evYield: string | undefined;
  baseFriendship: string | undefined;
  growthRate: string | undefined;
}

export function TrainingPanel({ evYield, baseFriendship, growthRate }: TrainingPanelProps) {
  return (
    <DataList
      rows={[
        { label: CONTENT.pdp.trainingLabels.evYield, value: evYield },
        { label: CONTENT.pdp.trainingLabels.baseFriendship, value: baseFriendship },
        { label: CONTENT.pdp.trainingLabels.growthRate, value: growthRate },
      ]}
    />
  );
}
