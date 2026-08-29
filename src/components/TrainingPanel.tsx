import { DataList } from "@/components/ui/DataList";

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
        { label: "EV yield", value: evYield },
        { label: "Base friendship", value: baseFriendship },
        { label: "Growth rate", value: growthRate },
      ]}
    />
  );
}
