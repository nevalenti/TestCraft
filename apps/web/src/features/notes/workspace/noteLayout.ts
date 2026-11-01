const SIDE_BY_SIDE_QUERY = "(min-width: 768px)";

export const isSideBySideLayout = () => matchMedia(SIDE_BY_SIDE_QUERY).matches;
