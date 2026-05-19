import SvgIcon from "./SvgIcon";

export const ChevronLeftIcon = ({ size }: { size?: string } = {}) => (
  <SvgIcon size={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </SvgIcon>
);
