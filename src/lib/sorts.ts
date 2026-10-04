/** Orders the results can be sorted in (?sort=price). Recommended is the default. */
export const sorts = ["recommended", "price", "station"] as const;
export type Sort = (typeof sorts)[number];
