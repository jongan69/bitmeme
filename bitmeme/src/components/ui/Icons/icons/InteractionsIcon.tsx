import Svg, { ClipPath, Defs, G, Path, Rect, SvgProps } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
  props?: SvgProps;
}

export default function InteractionIcon({ props, size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" {...props}>
      <G clipPath="url(#clip0_4298_16080)">
        <Path
          d="M3.56075 4.99977H7.24975C7.66375 4.99977 7.99975 4.66377 7.99975 4.24977C7.99975 3.83577 7.66375 3.49977 7.24975 3.49977H3.56075L4.78075 2.27977C5.07375 1.98677 5.07375 1.51177 4.78075 1.21877C4.48775 0.925773 4.01275 0.925773 3.71975 1.21877L1.21975 3.71977C0.92675 4.01277 0.92675 4.48777 1.21975 4.78077L3.71975 7.28077C3.86575 7.42677 4.05775 7.50077 4.24975 7.50077C4.44175 7.50077 4.63375 7.42777 4.77975 7.28077C5.07275 6.98777 5.07275 6.51277 4.77975 6.21977L3.55975 4.99977H3.56075Z"
          fill={color ?? 'currentColor'}
        />
        <Path
          d="M16.78 13.2197L14.28 10.7198C13.987 10.4268 13.512 10.4268 13.219 10.7198C12.926 11.0128 12.926 11.4877 13.219 11.7807L14.439 13.0008H10.75C10.336 13.0008 10 13.3368 10 13.7508C10 14.1648 10.336 14.5008 10.75 14.5008H14.439L13.219 15.7207C12.926 16.0137 12.926 16.4887 13.219 16.7817C13.365 16.9277 13.557 17.0018 13.749 17.0018C13.941 17.0018 14.133 16.9287 14.279 16.7817L16.779 14.2817C17.072 13.9887 17.072 13.5137 16.779 13.2207L16.78 13.2197Z"
          fill={color ?? 'currentColor'}
        />
        <Path
          d="M9 12.25C10.7949 12.25 12.25 10.7949 12.25 9C12.25 7.20507 10.7949 5.75 9 5.75C7.20507 5.75 5.75 7.20507 5.75 9C5.75 10.7949 7.20507 12.25 9 12.25Z"
          fill={color ?? 'currentColor'}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_4298_16080">
          <Rect width={size} height={size} fill={color ?? 'white'} />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
