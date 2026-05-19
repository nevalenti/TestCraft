import SvgIcon from "./SvgIcon";

export const ListIcon = ({ size }: { size?: string } = {}) => (
  <SvgIcon size={size}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6h16M4 10h16M4 14h16M4 18h10"
    />
  </SvgIcon>
);
