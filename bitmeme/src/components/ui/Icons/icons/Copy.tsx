import Svg, { G, Path, Rect, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function CopyIcon({ props, size = 18, color }: IconProps) {
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 18 18"
    >
      <G fill={color}>
        <Rect x="1" y="1" width="12.5" height="12.5" rx="2.75" ry="2.75"></Rect>
        <Path d="M15.282,4.7c-.384-.153-.821,.03-.977,.414-.155,.384,.03,.821,.414,.977,.475,.192,.782,.647,.782,1.159v7c0,.689-.561,1.25-1.25,1.25H7.25c-.512,0-.967-.307-1.159-.782-.155-.384-.592-.568-.977-.414-.384,.156-.569,.593-.414,.977,.423,1.044,1.424,1.718,2.55,1.718h7c1.516,0,2.75-1.234,2.75-2.75V7.25c0-1.126-.674-2.127-1.718-2.55Z"></Path>
      </G>
    </Svg>
  );
}
