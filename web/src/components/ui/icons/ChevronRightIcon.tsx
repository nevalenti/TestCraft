import SvgIcon from "./SvgIcon";

export const ChevronRightIcon = ({ size }: { size?: string } = {}) => (
  <SvgIcon size={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </SvgIcon>
);
