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
    <div
      className={`flex flex-col items-center ${className}`}
      style={{
        background: "transparent",
        minHeight: "280px",
      }}
    >
      {/* Inner wrapper: constrains overlays to image width */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          overflow: "hidden",
          background: "transparent",
        }}
      >
        <img
          src={image}
          alt={`${label} body type reference`}
          style={{
            height: "100%",
            minHeight: "260px",
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            position: "relative",
            zIndex: 0,
            background: "transparent",
            display: "block",
          }}
        />

        {/* Color overlays — screen blend for dark backgrounds */}
        {colors.length > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            {topColor && (
              <div
                style={{
                  position: "absolute",
                  left: "18%",
                  right: "18%",
                  top: "10%",
                  height: "30%",
                  backgroundColor: topColor,
                  opacity: 0.6,
                  mixBlendMode: "screen",
                  borderRadius: "1rem",
                }}
              />
            )}

            {bottomColor && (
              <div
                style={{
                  position: "absolute",
                  left: "20%",
                  right: "20%",
                  top: "40%",
                  height: "32%",
                  backgroundColor: bottomColor,
                  opacity: 0.55,
                  mixBlendMode: "screen",
                  borderRadius: "1rem",
                }}
              />
            )}

            {accentColor && (
              <div
                style={{
                  position: "absolute",
                  left: "24%",
                  right: "24%",
                  bottom: "8%",
                  height: "14%",
                  backgroundColor: accentColor,
                  opacity: 0.6,
                  mixBlendMode: "screen",
                  borderRadius: "0.75rem",
                }}
              />
            )}
          </div>
        )}

        {/* Body type label */}
        <div
          style={{
            position: "absolute",
            bottom: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
          }}
        >
          <span
            style={{
              fontSize: "9px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "2px 8px",
              borderRadius: "9999px",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#aaa",
            }}
          >
            {label}
          </span>
        </div>

        {/* Color legend */}
        {showColorLegend && colors.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
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
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.4)",
                        backgroundColor: item.color,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: 600,
                        color: "#fff",
                        background: "rgba(0,0,0,0.5)",
                        padding: "1px 5px",
                        borderRadius: "4px",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
