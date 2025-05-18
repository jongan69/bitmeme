import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function ChevronDownSmallIcon({
  props,
  size = 16,
  color,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 17 16"
      fill="none"
      {...props}
    >
      <Path
        d="M11.8259 6.16667L8.20636 9.78619C8.18032 9.81223 8.13811 9.81223 8.11208 9.78619L4.49255 6.16667"
        stroke={color ?? "#000"}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
    </Svg>
  );
}
