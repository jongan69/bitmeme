import Svg, { ClipPath, Defs, G, Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function InfoSmallIcon({ props, size = 12, color }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      {...props}
    >
      <G clipPath="url(#info_svg__a)">
        <Path
          fill={color}
          d="M6 0C2.691 0 0 2.691 0 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6m.75 8.5a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 1.5 0zM6 4a.877.877 0 0 1-.875-.875c0-.482.393-.875.875-.875s.875.393.875.875A.877.877 0 0 1 6 4"
        />
      </G>
      <Defs>
        <ClipPath id="info_svg__a">
          <Path fill="#fff" d="M0 0h12v12H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
