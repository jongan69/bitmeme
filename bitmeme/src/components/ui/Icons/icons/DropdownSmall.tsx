import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function DropdownSmallIcon({
  props,
  size = 12,
  color,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      {...props}
    >
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        d="m3 4 3-3 3 3M3 8l3 3 3-3"
      />
    </Svg>
  );
}
