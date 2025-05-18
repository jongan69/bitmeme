import Svg, { Defs, G, Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function NoteSmallIcon({ props, size = 12, color }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      {...props}
    >
      <G clipPath="url(#note_svg__a)">
        <path
          fill="currentColor"
          d="M6 0C2.691 0 0 2.691 0 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6m-.75 3.5a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0zM6 9.75a.877.877 0 0 1-.875-.875C5.125 8.393 5.518 8 6 8s.875.393.875.875A.877.877 0 0 1 6 9.75"
        />
      </G>
      <Defs>
        <clipPath id="note_svg__a">
          <Path fill={color} d="M0 0h12v12H0z" />
        </clipPath>
      </Defs>
    </Svg>
  );
}
