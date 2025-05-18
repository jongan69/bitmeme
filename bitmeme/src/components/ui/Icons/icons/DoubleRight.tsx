import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function DoubleRightIcon({ props, size = 18, color }: IconProps) {
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
    >
      <Path
        d="M9.875 4.875L13.947 8.94697C13.9763 8.97626 13.9763 9.02374 13.947 9.05303L9.875 13.125"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M5 4.875L9.07197 8.94697C9.10126 8.97626 9.10126 9.02374 9.07197 9.05303L5 13.125"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
