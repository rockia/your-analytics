import { get, writable } from "svelte/store";
import { QUERY_API_BASE_URL } from "../config";
import { userTokenStore } from "../auth/magic";

const fetchStats = async (path, store) => {
  if (!get(userTokenStore)) {
    return;
  }

  const url = new URL(`${QUERY_API_BASE_URL}/${path}`);
  url.searchParams.append("from", get(dateRange).from);
  url.searchParams.append("to", get(dateRange).to);

  const response = await fetch(url, {
    headers: new Headers({
      Authorization: "Bearer " + get(userTokenStore),
    }),
  });

  if (response.status === 200) {
    store.set((await response.json()).data);
  }
};

export const topPages = writable(null);
export const fetchTopPages = () => fetchStats("top-pages", topPages);

export const topReferrers = writable(null);
export const fetchTopReferrers = () =>
  fetchStats("top-referrers", topReferrers);

export const visitors = writable(null);
export const fetchVisitors = () => fetchStats("visitors", visitors);

export const worldMap = writable(null);
export const fetchWorldMap = () => fetchStats("world-map", worldMap);

export const dateRange = writable({
  from: -1,
  to: -1,
});
dateRange.subscribe(async () => {
  await Promise.allSettled([
    fetchTopPages(),
    fetchTopReferrers(),
    fetchVisitors(),
    fetchWorldMap(),
  ]);
});