import SvgIcon from "./SvgIcon";

export const MinusIcon = ({ size }: { size?: string } = {}) => (
  <SvgIcon size={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </SvgIcon>
);
