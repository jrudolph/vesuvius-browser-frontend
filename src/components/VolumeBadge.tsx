import { ExternalLink } from "lucide-react";
import { Badge } from "./ui/badge";

const VolumeBadge = (volume, colorFor = (_a, _b) => "") => {
  const sizeColor =
    volume.voxelSizenM == 7910 ? "bg-emerald-500" : "bg-emerald-700";
  const energyColor =
    volume.energykeV < 60
      ? "bg-amber-500"
      : volume.energykeV < 80
        ? "bg-amber-600"
        : "bg-amber-700";

  return (
    <div className="flex flex-nowrap">
      <Badge className={`rounded-r-none ${colorFor("volume", volume.volume)}`}>
        {volume.volume}
      </Badge>
      <Badge className={`rounded-none ${sizeColor}`}>
        {volume.voxelSizenM / 1000}µm
      </Badge>
      <Badge className={`rounded-l-none ${energyColor}`}>
        {volume.energykeV}keV
      </Badge>
      <a href={volume.baseUrl} target="_blank">
        <ExternalLink className="w-4 h-4 ml-1" />
      </a>
    </div>
  );
};

export default VolumeBadge;
