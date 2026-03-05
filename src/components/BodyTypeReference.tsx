import femaleHourglass from "@/assets/body-female-hourglass.png";
import femalePear from "@/assets/body-female-pear.png";
import femaleApple from "@/assets/body-female-apple.png";
import femaleRectangle from "@/assets/body-female-rectangle.png";
import femaleInvertedTriangle from "@/assets/body-female-inverted_triangle.png";
import maleAthletic from "@/assets/body-male-athletic.png";
import maleRectangle from "@/assets/body-male-rectangle.png";
import maleOval from "@/assets/body-male-oval.png";
import maleTrapezoid from "@/assets/body-male-trapezoid.png";
import maleInvertedTriangle from "@/assets/body-male-inverted_triangle.png";

const BODY_IMAGES: Record<string, Record<string, string>> = {
  female: {
    hourglass: femaleHourglass,
    pear: femalePear,
    apple: femaleApple,
    rectangle: femaleRectangle,
    inverted_triangle: femaleInvertedTriangle,
  },
  male: {
    athletic: maleAthletic,
    rectangle: maleRectangle,
    oval: maleOval,
    trapezoid: maleTrapezoid,
    inverted_triangle: maleInvertedTriangle,
  },
};

const BODY_LABELS: Record<string, string> = {
  hourglass: "Hourglass",
  pear: "Pear",
  apple: "Apple",
  rectangle: "Rectangle",
  inverted_triangle: "Inverted Triangle",
  athletic: "Athletic / V-Shape",
  oval: "Oval",
  trapezoid: "Trapezoid",
};

interface BodyTypeReferenceProps {
  gender: string | null;
  bodyShape: string;
  colors?: string[];
  colorNames?: string[];
  className?: string;
  showColorLegend?: boolean;
}

export default function BodyTypeReference({
  gender,
  bodyShape,
  colors = [],
  colorNames = [],
  className = "",
  showColorLegend = false,
}: BodyTypeReferenceProps) {
  const genderKey = gender === "male" ? "male" : "female";
  const image =
    BODY_IMAGES[genderKey]?.[bodyShape] ||
    BODY_IMAGES[genderKey]?.[Object.keys(BODY_IMAGES[genderKey])[0]];
  const label = BODY_LABELS[bodyShape] || bodyShape;

  if (!image) return null;

  const topColor = colors[0] || null;
  const bottomColor = colors[1] || colors[0] || null;
  const accentColor = colors[2] || colors[1] || colors[0] || null;

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      
      {/* 
        LAYER ORDER (bottom to top):
        1. Silhouette image (z-0) — base layer
        2. Color overlays (z-10) — ON TOP of image, using mix-blend-multiply
           so they tint the figure rather than cover it
        3. Labels (z-20) — always on top
      */}

      {/* Silhouette image — base layer */}
      <img
        src={image}
        alt={`${label} body type reference`}
        className="h-full w-auto max-h-full object-contain relative z-0"
      />

      {/* Color overlays — ABOVE the image, blending into it */}
      {colors.length > 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          
          {/* Top garment zone: roughly shoulders to waist */}
          {topColor && (
            <div
              className="absolute left-[18%] right-[18%] top-[10%] h-[30%] rounded-2xl"
              style={{
                backgroundColor: topColor,
                opacity: 0.55,
                mixBlendMode: "multiply",
              }}
            />
          )}

          {/* Bottom garment zone: waist to knees */}
          {bottomColor && (
            <div
              className="absolute left-[20%] right-[20%] top-[40%] h-[32%] rounded-2xl"
              style={{
                backgroundColor: bottomColor,
                opacity: 0.5,
                mixBlendMode: "multiply",
              }}
            />
          )}

          {/* Footwear zone: ankles to feet */}
          {accentColor && (
            <div
              className="absolute left-[24%] right-[24%] bottom-[8%] h-[14%] rounded-xl"
              style={{
                backgroundColor: accentColor,
                opacity: 0.55,
                mixBlendMode: "multiply",
              }}
            />
          )}
        </div>
      )}

      {/* Body type label */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm border border-border text-muted-foreground">
          {label}
        </span>
      </div>

      {/* Color legend */}
      {showColorLegend && colors.length > 0 && (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
          {[
            { color: topColor, label: colorNames[0] || "Top" },
            ...(colors.length > 1
              ? [{ color: bottomColor, label: colorNames[1] || "Bottom" }]
              : []),
            ...(colors.length > 2
              ? [{ color: accentColor, label: colorNames[2] || "Accent" }]
              : []),
          ].map(
            (item, i) =>
              item.color && (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-md border border-white/50 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[8px] font-semibold text-foreground bg-card/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                    {item.label}
                  </span>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}
