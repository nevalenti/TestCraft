import SvgIcon from "./SvgIcon";

export const NoEntryIcon = ({ size }: { size?: string } = {}) => (
  <SvgIcon size={size}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M9 12h6" />
  </SvgIcon>
);
