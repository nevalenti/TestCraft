import SvgIcon from "./SvgIcon";

export const XIcon = ({ size }: { size?: string } = {}) => (
  <SvgIcon size={size}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </SvgIcon>
);
