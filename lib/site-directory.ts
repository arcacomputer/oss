import { getContributionDirectory } from "@/lib/contributions";
import { getActivityFeed, getOpenClawLedger, supportPrograms, trackingIdentities, trackingSince } from "@/lib/data";

export function getTrackedDirectory() {
  return getContributionDirectory(
    getActivityFeed().events,
    getOpenClawLedger().pullRequests,
    supportPrograms,
    { authors: trackingIdentities.map(identity => identity.login), since: trackingSince },
  );
}
