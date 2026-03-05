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
  const image = BODY_IMAGES[genderKey]?.[bodyShape] || BODY_IMAGES[genderKey]?.[Object.keys(BODY_IMAGES[genderKey])[0]];
  const label = BODY_LABELS[bodyShape] || bodyShape;

  if (!image) return null;

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Strong color gradient background */}
      {colors.length > 0 && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(180deg, ${colors[0] || "transparent"}33 0%, ${colors[1] || "transparent"}44 40%, ${colors[2] || "transparent"}33 100%)`,
          }}
        />
      )}
      {/* Color accent stripes on sides */}
      {colors.length > 0 && (
        <>
          <div
            className="absolute left-0 top-[15%] bottom-[15%] w-2 rounded-r-full pointer-events-none"
            style={{ backgroundColor: colors[0], opacity: 0.7 }}
          />
          <div
            className="absolute right-0 top-[15%] bottom-[15%] w-2 rounded-l-full pointer-events-none"
            style={{ backgroundColor: colors[colors.length > 1 ? 1 : 0], opacity: 0.7 }}
          />
        </>
      )}
      <img
        src={image}
        alt={`${label} body type reference`}
        className="h-full w-auto max-h-full object-contain mix-blend-multiply relative z-10"
      />
      {/* Body type label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm border border-border text-muted-foreground">
          {label}
        </span>
      </div>
      {/* Color legend */}
      {showColorLegend && colors.length > 0 && (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-md border border-white/50 shadow-sm"
                style={{ backgroundColor: c }}
              />
              <span className="text-[8px] font-semibold text-foreground bg-card/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                {colorNames[i] || ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
