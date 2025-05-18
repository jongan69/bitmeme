import Svg, { Circle, Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
} 

function UnknownIcon({ props, size = 18, color }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      {...props}
    >
      <Circle
        cx={16}
        cy={16}
        r={16}
        fill={color || "#E0E0E0"}
      />
      <Path
        data-name="Path"
        d="M6 0h10v2h2v2h2v2h2v6h-2v2h-2v2h-2v2h-2v2h-2v2h2v2h2v4h-2v2h-2v2h-2v-2H8v-2h2v-2h2v-2H8v-2h2v-2H8v-6h2v4h2v-4h2V8h-2V6H6v2H4v2h2v2H4v2H2v-2H0V6h2V4h2V2h2z"
        transform="translate(4)"
        fill="#1a1a1a"
      />
      <Path
        data-name="Path"
        d="M0 0h6v6H4V2H0z"
        transform="translate(10 8)"
        fill="#1a1a1a"
      />
      <Path
        data-name="Path"
        d="M0 0h2v4H0z"
        transform="translate(10 24)"
        fill="#1a1a1a"
      />
    </Svg>
  )
}

export default UnknownIcon;

