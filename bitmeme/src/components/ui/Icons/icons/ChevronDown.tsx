import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function ChevronDownIcon({ props, size = 18, color }: IconProps) {
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
    >
      <Path
        stroke={color ?? "#000"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        d="m3 6.5 6 6 6-6"
      />
    </Svg>
  );
}
